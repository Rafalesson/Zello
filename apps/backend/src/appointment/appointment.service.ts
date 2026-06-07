import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DomainErrorCode } from '@imnotmedical/shared';
import { MailService } from '../mail/mail.service';

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
        status: { not: 'CANCELADA' },
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
        status: { not: 'CANCELADA' },
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
        status: 'AGENDADA',
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
}
