import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';
import { TemplatesService } from 'src/templates/templates.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CertificateData } from './certificate.types';
import { calculateAge, numberToWords, buildDocumentFileBase } from 'src/utils';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma, Sex } from '@prisma/client';
import { randomBytes } from 'crypto';

type UserWithProfiles = Prisma.UserGetPayload<{
  include: {
    doctorProfile: { include: { address: true } };
    patientProfile: true;
  };
}>;

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private static readonly SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly templatesService: TemplatesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private formatDateToSaoPaulo(value?: string | Date | null): string {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }

    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: CertificateService.SAO_PAULO_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatCpf(value?: string | null): string {
    if (!value) {
      return '';
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length !== 11) {
      return value;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  private createCertificateCode(length = 8): string {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = randomBytes(length);
    let code = '';

    for (let i = 0; i < bytes.length; i++) {
      code += alphabet[bytes[i] % alphabet.length];
    }

    return code;
  }

  private async generateUniqueCertificateCode(): Promise<string> {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.createCertificateCode();
      const existing = await this.prisma.medicalCertificate.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }

    const fallback = `${this.createCertificateCode()}${Date.now()
      .toString(36)
      .slice(-2)
      .toUpperCase()}`;

    return fallback.slice(0, 12);
  }

  private async prepareDataForPdf(
    dto: CreateCertificateDto,
    doctorId: number,
    certificateCode: string,
  ): Promise<CertificateData> {
    const patientId = dto.patientId ?? 0;

    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: { include: { address: true } } },
    });

    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: { patientProfile: true },
    });

    if (!doctor?.doctorProfile || !patient?.patientProfile) {
      throw new NotFoundException(
        'Perfil do medico ou do paciente nao encontrado.',
      );
    }

    const doctorAddressObj = doctor.doctorProfile.address;
    const formattedDoctorAddress = doctorAddressObj
      ? `${doctorAddressObj.street}, ${doctorAddressObj.number} - ${doctorAddressObj.city}, ${doctorAddressObj.state}`
      : 'Endereço não informado';

    const cid = dto.cidCode
      ? await this.prisma.cidCode.findUnique({ where: { code: dto.cidCode } })
      : null;
    const issueDate = new Date();

    return {
      doctorName: doctor.doctorProfile.name,
      doctorCrm: doctor.doctorProfile.crm,
      doctorSpecialty: doctor.doctorProfile.specialty,
      doctorAddress: formattedDoctorAddress,
      doctorPhone: doctor.doctorProfile.phone,
      patientName: patient.patientProfile.name,
      patientCpf: this.formatCpf(patient.patientProfile.cpf),
      patientAge: calculateAge(
        new Date(patient.patientProfile.dateOfBirth),
      ).toString(),
      patientSex:
        patient.patientProfile.sex === Sex.MALE
          ? 'Masculino'
          : patient.patientProfile.sex === Sex.FEMALE
            ? 'Feminino'
            : 'Não informado',
      legalRepresentative: dto.legalRepresentative?.trim() || null,
      legalRepresentativeCpf: dto.legalRepresentativeCpf
        ? this.formatCpf(dto.legalRepresentativeCpf.trim())
        : null,
      signatureStyle: dto.signatureStyle?.trim() || null,
      durationInDays: dto.durationInDays || 0,
      durationInWords: numberToWords(dto.durationInDays || 0),
      startDate: dto.startDate
        ? this.formatDateToSaoPaulo(dto.startDate)
        : this.formatDateToSaoPaulo(issueDate),
      purpose: dto.purpose,
      cidCode: dto.cidCode,
      cidDescription: cid?.description,
      issueDateTime: issueDate.toISOString(),
      certificateId: certificateCode || '',
    };
  }

  async generateCertificatePdf(
    dto: CreateCertificateDto,
    doctorId: number,
  ): Promise<Buffer> {
    const previewCode = await this.generateUniqueCertificateCode();
    const data = await this.prepareDataForPdf(dto, doctorId, previewCode);
    const html = await this.templatesService.getPopulatedCertificateHtml(
      data,
      dto.templateId,
    );
    return this.pdfService.generatePdfFromHtml(html);
  }

  async create(createCertificateDto: CreateCertificateDto, doctorId: number) {
    const code = await this.generateUniqueCertificateCode();

    const certificateRecord = await this.prisma.medicalCertificate.create({
      data: {
        code,
        purpose: createCertificateDto.purpose,
        startDate: createCertificateDto.startDate,
        durationInDays: createCertificateDto.durationInDays,
        cidCode: createCertificateDto.cidCode,
        observations: createCertificateDto.observations,
        templateId: createCertificateDto.templateId || 'default',
        doctor: { connect: { id: doctorId } },
        patient: {
          connect: { id: createCertificateDto.patientId },
        },
      },
    });

    const data = await this.prepareDataForPdf(
      createCertificateDto,
      doctorId,
      certificateRecord.code,
    );
    const html = await this.templatesService.getPopulatedCertificateHtml(
      data,
      createCertificateDto.templateId,
    );
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);
    const patientFileBase = buildDocumentFileBase(
      'atestado_medico',
      data.patientName,
      certificateRecord.code ?? certificateRecord.id,
    );

    // Armazena o PDF gerado na Cloudinary quando as credenciais estao configuradas.
    if (this.cloudinaryService.isEnabled()) {
      try {
        const uploadResult = await this.cloudinaryService.uploadCertificatePdf(
          pdfBuffer,
          patientFileBase,
        );

        return this.prisma.medicalCertificate.update({
          where: { id: certificateRecord.id },
          data: { pdfUrl: uploadResult.secure_url },
        });
      } catch (error) {
        this.logger.error('Falha ao enviar PDF para a Cloudinary:', error);
      }
    }

    // Fallback para a pasta local quando a Cloudinary estiver desativada.
    const pdfDir = path.join(process.cwd(), 'storage', 'certificates');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfFileName = `${patientFileBase}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    return this.prisma.medicalCertificate.update({
      where: { id: certificateRecord.id },
      data: { pdfUrl: `/storage/certificates/${pdfFileName}` },
    });
  }

  findAllByDoctor(doctorId: number) {
    return this.prisma.medicalCertificate.findMany({
      where: { doctorId: doctorId },
      orderBy: { issueDate: 'desc' },
      include: {
        patient: { include: { patientProfile: true } },
      },
      take: 5,
    });
  }

  async validateCertificate(identifier: string) {
    const cleanedIdentifier = identifier.trim();
    const codeIdentifier = cleanedIdentifier.toUpperCase();

    const include = {
      doctor: { include: { doctorProfile: true } },
      patient: { include: { patientProfile: true } },
    };

    let certificate = await this.prisma.medicalCertificate.findUnique({
      where: { code: codeIdentifier },
      include,
    });

    if (!certificate && /^\d+$/.test(cleanedIdentifier)) {
      certificate = await this.prisma.medicalCertificate.findUnique({
        where: { id: Number.parseInt(cleanedIdentifier, 10) },
        include,
      });
    }

    if (!certificate) {
      throw new NotFoundException('Atestado nao encontrado.');
    }

    return {
      issuedAt: certificate.issueDate,
      durationInDays: certificate.durationInDays,
      doctorName: certificate.doctor.doctorProfile?.name,
      doctorCrm: certificate.doctor.doctorProfile?.crm,
      patientName: certificate.patient.patientProfile?.name?.trim() || '',
      pdfUrl: certificate.pdfUrl ?? null,
    };
  }

  async searchByDoctor(
    doctorId: number,
    options: { page?: number; limit?: number; patientName?: string },
  ) {
    const { page = 1, limit = 10, patientName } = options;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.MedicalCertificateWhereInput = {
      doctorId: doctorId,
    };

    if (patientName) {
      whereClause.patient = {
        patientProfile: {
          name: { contains: patientName, mode: 'insensitive' },
        },
      };
    }

    const [certificates, total] = await this.prisma.$transaction([
      this.prisma.medicalCertificate.findMany({
        where: whereClause,
        include: {
          patient: { select: { patientProfile: { select: { name: true } } } },
        },
        orderBy: { issueDate: 'desc' },
        take: limit,
        skip: skip,
      }),
      this.prisma.medicalCertificate.count({ where: whereClause }),
    ]);

    return {
      data: certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const certificate = await this.prisma.medicalCertificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException(`Atestado com ID ${id} nao encontrado.`);
    }

    if (certificate.pdfUrl) {
      if (this.cloudinaryService.isEnabled()) {
        // Mantem os fluxos de exclusao remota/local sincronizados de acordo com o storage ativo.
        try {
          await this.cloudinaryService.deleteCertificatePdfByUrl(
            certificate.pdfUrl,
          );
        } catch (error) {
          console.error(
            `Falha ao deletar o arquivo no Cloudinary: ${certificate.pdfUrl}`,
            error,
          );
        }
      } else {
        const filePath = path.join(process.cwd(), certificate.pdfUrl);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(
            `Falha ao deletar o arquivo fisico: ${filePath}`,
            error,
          );
        }
      }
    }

    await this.prisma.medicalCertificate.delete({
      where: { id },
    });

    return { message: 'Atestado deletado com sucesso.' };
  }

  async removeMany(ids: number[]): Promise<{ message: string; count: number }> {
    const certificatesToDelete = await this.prisma.medicalCertificate.findMany({
      where: { id: { in: ids } },
    });

    if (certificatesToDelete.length === 0) {
      throw new NotFoundException(
        'Nenhum atestado encontrado para os IDs fornecidos.',
      );
    }

    for (const certificate of certificatesToDelete) {
      if (certificate.pdfUrl) {
        if (this.cloudinaryService.isEnabled()) {
          // Mantem os fluxos de exclusao remota/local sincronizados de acordo com o storage ativo.
          try {
            await this.cloudinaryService.deleteCertificatePdfByUrl(
              certificate.pdfUrl,
            );
          } catch (error) {
            console.error(
              `Falha ao deletar o arquivo no Cloudinary: ${certificate.pdfUrl}`,
              error,
            );
          }
        } else {
          const filePath = path.join(process.cwd(), certificate.pdfUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    const { count } = await this.prisma.medicalCertificate.deleteMany({
      where: { id: { in: ids } },
    });

    return { message: `${count} atestado(s) deletado(s) com sucesso.`, count };
  }
}
