import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Get,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConsultationStatus } from '@prisma/client';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('appointments')
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/consent')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  async createConsent(
    @Req() req: any,
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() dto: CreateConsentDto,
  ) {
    await this.validatePatientOwnership(req.user.id, appointmentId);

    // Prevent duplicate consent records
    const existing = await this.consentService.findByAppointmentId(appointmentId);
    if (existing) {
      throw new ConflictException('O consentimento já foi registrado para esta consulta.');
    }

    const activeTerms = await this.consentService.getActiveTerms();
    if (!activeTerms) {
      throw new BadRequestException('Nenhum termo de consentimento ativo cadastrado.');
    }

    if (dto.termsVersion !== activeTerms.version) {
      throw new BadRequestException(
        'Os termos de consentimento foram atualizados. Por favor, recarregue a página para aceitar a versão mais recente.',
      );
    }

    const xForwardedFor = req.headers['x-forwarded-for'];
    const ipHeader = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    const rawIp = ipHeader?.split(',')[0]?.trim() || req.ip || null;
    const ipAddress = rawIp ? rawIp.slice(0, 45) : null;

    const rawUserAgent = req.headers['user-agent'];
    const userAgent = rawUserAgent
      ? (Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent).slice(0, 500)
      : null;

    try {
      return await this.consentService.create(
        appointmentId,
        dto.accepted,
        dto.termsVersion,
        ipAddress,
        userAgent,
      );
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('O consentimento já foi registrado para esta consulta.');
      }
      throw error;
    }
  }

  @Get(':id/consent')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT', 'DOCTOR')
  async getConsent(
    @Req() req: any,
    @Param('id', ParseIntPipe) appointmentId: number,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: true,
        patientProfile: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    const user = req.user;
    const isPatientOwner =
      appointment.patientProfile && appointment.patientProfile.userId === user.id;
    const isDoctorOwner =
      appointment.doctorProfile && appointment.doctorProfile.userId === user.id;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    return this.consentService.findByAppointmentId(appointmentId);
  }

  /**
   * Validates that the authenticated user (patient) is the owner of the appointment.
   * Prevents ID leaking by returning generic error for both not-found and unauthorized cases.
   */
  private async validatePatientOwnership(
    userId: number,
    appointmentId: number,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
      },
    });

    if (!appointment || !appointment.patientProfile) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    if (appointment.patientProfile.userId !== userId) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    if (appointment.status !== ConsultationStatus.AGENDADA) {
      throw new BadRequestException(
        'O consentimento só pode ser registrado para consultas agendadas.',
      );
    }
  }
}
