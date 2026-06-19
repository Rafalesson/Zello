import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DomainErrorCode } from '@imnotmedical/shared';
import { MailService } from '../mail/mail.service';
import { ConsultationStatus } from '@prisma/client';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getAvailableSlots(doctorId: number, dateString: string) {
    // We expect dateString in format YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD.');
    }
    const queryDate = new Date(year, month - 1, day);
    const dayOfWeek = queryDate.getDay();

    const doctorSlots = await this.prisma.availability.findMany({
      where: {
        doctorProfileId: doctorId,
        dayOfWeek,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (doctorSlots.length === 0) return [];

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorProfileId: doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: ConsultationStatus.CANCELADA },
      },
    });

    const availableSlots: any[] = [];
    for (const slot of doctorSlots) {
      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      
      const blockStart = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
      const blockEnd = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

      let currentSlotDate = new Date(blockStart);

      while (currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000) <= blockEnd.getTime()) {
        const isTaken = appointments.some((app) => app.date.getTime() === currentSlotDate.getTime());
        const isPast = currentSlotDate.getTime() < new Date().getTime();

        if (!isTaken && !isPast) {
          const slotEndTime = new Date(currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000));
          
          const formatTime = (d: Date) => 
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

          availableSlots.push({
            startTime: formatTime(currentSlotDate),
            endTime: formatTime(slotEndTime),
            date: currentSlotDate.toISOString(),
            slotDurationMinutes: slot.slotDurationMinutes,
          });
        }
        
        currentSlotDate = new Date(currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000));
      }
    }

    return availableSlots;
  }

  async create(userId: number, createAppointmentDto: CreateAppointmentDto) {
    const { doctorProfileId, date } = createAppointmentDto;

    // Get patient profile
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true },
    });

    if (!userWithProfile?.patientProfile) {
      throw new BadRequestException('Usuário não possui perfil de paciente.');
    }

    const patientProfileId = userWithProfile.patientProfile.id;
    const appointmentDate = new Date(date);

    // Ensure the date is valid
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Data de agendamento inválida.');
    }

    if (appointmentDate.getTime() < new Date().getTime()) {
      throw new BadRequestException('Não é possível agendar uma consulta em um horário que já passou.');
    }

    // Validate that slot is available
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorProfileId,
        date: appointmentDate,
        status: { not: ConsultationStatus.CANCELADA },
      },
    });

    if (existingAppointment) {
      throw new BadRequestException({
        code: DomainErrorCode.SLOT_UNAVAILABLE,
        message: 'O horário selecionado não está mais disponível.',
      });
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        doctorProfileId,
        patientProfileId,
        date: appointmentDate,
        status: ConsultationStatus.AGENDADA,
      },
      include: {
        doctorProfile: { include: { user: true } },
        patientProfile: { include: { user: true } },
      },
    });

    this.logger.log('APPOINTMENT CREATED: ' + JSON.stringify(appointment));

    // Fire and forget emails
    this.mailService
      .sendBookingConfirmationToPatient(
        appointment.patientProfile.user.email,
        appointment.patientProfile.name || 'Paciente',
        appointment.doctorProfile.name || 'Médico',
        appointmentDate,
      )
      .catch((err) => this.logger.error('Erro silencioso ao enviar email paciente:', err));

    this.mailService
      .sendBookingConfirmationToDoctor(
        appointment.doctorProfile.user.email,
        appointment.doctorProfile.name || 'Médico',
        appointment.patientProfile.name || 'Paciente',
        appointmentDate,
      )
      .catch((err) => this.logger.error('Erro silencioso ao enviar email medico:', err));

    return appointment;
  }

  async getDoctorAppointments(doctorProfileId: number) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10) - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    const startOfToday = new Date(Date.UTC(year, month, day, 3, 0, 0, 0)); // BRT is UTC-3

    return this.prisma.appointment.findMany({
      where: {
        doctorProfileId,
        date: {
          gte: startOfToday,
        },
      },
      include: {
        patientProfile: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async getPatientAppointments(patientProfileId: number) {
    return this.prisma.appointment.findMany({
      where: {
        patientProfileId,
      },
      include: {
        doctorProfile: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async cancelAppointment(appointmentId: number, patientProfileId: number, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patientProfile: true,
      },
    });

    if (!appointment || appointment.patientProfileId !== patientProfileId) {
      throw new BadRequestException('Consulta não encontrada.');
    }

    if (appointment.status === ConsultationStatus.CANCELADA) {
      throw new BadRequestException('A consulta já está cancelada.');
    }

    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    if (appointment.date.getTime() - new Date().getTime() < twelveHoursInMs) {
      throw new BadRequestException('Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: ConsultationStatus.CANCELADA,
        cancellationReason: reason,
      },
    });

    this.logger.log(`APPOINTMENT CANCELLED: ${appointmentId} by patient ${patientProfileId}`);

    // Fire and forget email to doctor
    if (appointment.doctorProfile?.user?.email) {
      this.mailService
        .sendCancellationToDoctor(
          appointment.doctorProfile.user.email,
          appointment.doctorProfile.name || 'Médico',
          appointment.patientProfile.name || 'Paciente',
          appointment.date,
          reason,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de cancelamento ao médico:', err));
    }

    return updatedAppointment;
  }

  async rescheduleAppointment(appointmentId: number, patientProfileId: number, newDateStr: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patientProfile: { include: { user: true } },
      },
    });

    if (!appointment || appointment.patientProfileId !== patientProfileId) {
      throw new BadRequestException('Consulta não encontrada.');
    }

    if (appointment.status === ConsultationStatus.CANCELADA || appointment.status === ConsultationStatus.REALIZADA) {
      throw new BadRequestException('Não é possível remarcar uma consulta finalizada ou cancelada.');
    }

    const sixHoursInMs = 6 * 60 * 60 * 1000;
    if (appointment.date.getTime() - new Date().getTime() < sixHoursInMs) {
      throw new BadRequestException('Reagendamentos só podem ser feitos com pelo menos 6 horas de antecedência.');
    }

    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime()) || newDate.getTime() < new Date().getTime()) {
      throw new BadRequestException('Nova data inválida ou no passado.');
    }

    // Validate that slot is available
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorProfileId: appointment.doctorProfileId,
        date: newDate,
        status: { not: ConsultationStatus.CANCELADA },
      },
    });

    if (existingAppointment) {
      throw new BadRequestException({
        code: DomainErrorCode.SLOT_UNAVAILABLE,
        message: 'O novo horário selecionado não está mais disponível.',
      });
    }

    const oldDate = appointment.date;

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        date: newDate,
        status: ConsultationStatus.AGENDADA,
      },
    });

    this.logger.log(`APPOINTMENT RESCHEDULED: ${appointmentId} from ${oldDate} to ${newDate}`);

    // Fire and forget emails
    if (appointment.patientProfile?.user?.email) {
      this.mailService
        .sendRescheduleEmailToPatient(
          appointment.patientProfile.user.email,
          appointment.patientProfile.name || 'Paciente',
          appointment.doctorProfile.name || 'Médico',
          oldDate,
          newDate,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (paciente):', err));
    }

    if (appointment.doctorProfile?.user?.email) {
      this.mailService
        .sendRescheduleEmailToDoctor(
          appointment.doctorProfile.user.email,
          appointment.doctorProfile.name || 'Médico',
          appointment.patientProfile.name || 'Paciente',
          oldDate,
          newDate,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (medico):', err));
    }

    return updatedAppointment;
  }
}

