import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsultationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreTriageDto } from './dto/create-pre-triage.dto';

@Injectable()
export class PreTriageService {
  private readonly logger = new Logger(PreTriageService.name);

  constructor(private prisma: PrismaService) {}

  async createOrUpdate(userId: number, appointmentId: number, dto: CreatePreTriageDto) {
    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { patientProfile: true },
      });

      if (!appointment || !appointment.patientProfile || appointment.patientProfile.userId !== userId) {
        throw new NotFoundException('Consulta não encontrada.');
      }

      if (appointment.status !== ConsultationStatus.AGENDADA) {
        throw new BadRequestException('A pré-triagem só pode ser preenchida para consultas agendadas.');
      }

      const preTriage = await tx.preTriage.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          symptoms: dto.symptoms,
          duration: dto.duration,
          intensity: dto.intensity,
        },
        update: {
          symptoms: dto.symptoms,
          duration: dto.duration,
          intensity: dto.intensity,
        },
      });

      this.logger.log(`PRE-TRIAGE saved for appointment ${appointmentId} by user ${userId}`);
      return preTriage;
    });
  }

  async findByAppointmentId(appointmentId: number) {
    return this.prisma.preTriage.findUnique({
      where: { appointmentId },
    });
  }
}
