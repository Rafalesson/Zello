import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
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
      throw new BadRequestException({
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'Data inválida. Use o formato YYYY-MM-DD.',
      });
    }
    const queryDate = new Date(Date.UTC(year, month - 1, day));
    if (
      queryDate.getUTCFullYear() !== year ||
      queryDate.getUTCMonth() !== month - 1 ||
      queryDate.getUTCDate() !== day
    ) {
      throw new BadRequestException({
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'Data inexistente no calendário.',
      });
    }
    const dayOfWeek = queryDate.getUTCDay();

    const doctorSlots = await this.prisma.availability.findMany({
      where: {
        doctorProfileId: doctorId,
        dayOfWeek,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (doctorSlots.length === 0) return [];

    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

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
      if (!slot.slotDurationMinutes || slot.slotDurationMinutes <= 0) {
        continue;
      }
      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      
      const blockStart = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes, 0, 0));
      const blockEnd = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes, 0, 0));

      let currentSlotDate = new Date(blockStart);

      while (currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000) <= blockEnd.getTime()) {
        const isTaken = appointments.some((app) => app.date.getTime() === currentSlotDate.getTime());
        const isPast = currentSlotDate.getTime() < Date.now();

        if (!isTaken && !isPast) {
          const slotEndTime = new Date(currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000));
          
          const formatTime = (d: Date) => 
            `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

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
      throw new BadRequestException({
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'Usuário não possui perfil de paciente.',
      });
    }

    const patientProfileId = userWithProfile.patientProfile.id;
    const appointmentDate = new Date(date);

    // Ensure the date is valid
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException({
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'Data de agendamento inválida.',
      });
    }

    if (appointmentDate.getTime() < Date.now()) {
      throw new BadRequestException({
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'Não é possível agendar uma consulta em um horário que já passou.',
      });
    }

    const appointment = await this.prisma.$transaction(async (tx) => {
      // Row-level lock on the doctor profile to prevent concurrent bookings
      await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${doctorProfileId} FOR UPDATE`;

      // Check doctor availability slot matching
      const dayOfWeek = appointmentDate.getUTCDay();
      const availabilities = await tx.availability.findMany({
        where: { doctorProfileId, dayOfWeek, isActive: true },
      });
      if (availabilities.length === 0) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O médico não possui agenda disponível para o dia da semana selecionado.',
        });
      }
      const hours = appointmentDate.getUTCHours();
      const minutes = appointmentDate.getUTCMinutes();
      const timeMinutes = hours * 60 + minutes;
      const isValidSlot = availabilities.some((slot) => {
        if (slot.slotDurationMinutes <= 0) return false;
        const [sH, sM] = slot.startTime.split(':').map(Number);
        const [eH, eM] = slot.endTime.split(':').map(Number);
        const startMin = sH * 60 + sM;
        const endMin = eH * 60 + eM;
        return timeMinutes >= startMin &&
               timeMinutes + slot.slotDurationMinutes <= endMin &&
               (timeMinutes - startMin) % slot.slotDurationMinutes === 0;
      });
      if (!isValidSlot) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O horário selecionado não corresponde a um intervalo válido na agenda do médico.',
        });
      }

      // Validate that slot is available for the doctor
      const existingAppointment = await tx.appointment.findFirst({
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

      // Validate that patient does not have another appointment at exact same time
      const existingPatientAppointment = await tx.appointment.findFirst({
        where: {
          patientProfileId,
          date: appointmentDate,
          status: { not: ConsultationStatus.CANCELADA },
        },
      });

      if (existingPatientAppointment) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O paciente já possui uma consulta agendada para este horário.',
        });
      }

      return await tx.appointment.create({
        data: {
          doctorProfileId,
          patientProfileId,
          date: appointmentDate,
          status: ConsultationStatus.AGENDADA,
        },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });
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

  /**
   * Get doctor appointments from today onwards.
   * Uses UTC-normalized date calculations to avoid timezone drift. (AC: B4)
   */
  async getDoctorAppointments(doctorProfileId: number) {
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0,
    ));

    return this.prisma.appointment.findMany({
      where: {
        doctorProfileId,
        date: {
          gte: startOfTodayUTC,
        },
      },
      include: {
        patientProfile: { include: { user: true } },
        doctorProfile: { include: { user: true } },
        preTriage: true,
        consentRecord: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async getPatientAppointments(patientProfileId: number) {
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0,
    ));

    return this.prisma.appointment.findMany({
      where: {
        patientProfileId,
        date: {
          gte: startOfTodayUTC,
        },
      },
      include: {
        doctorProfile: { include: { user: true } },
        patientProfile: { include: { user: true } },
        preTriage: true,
        consentRecord: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get a single appointment by ID with ownership validation. (AC: C3)
   * Returns 404 for both non-existent and non-owned appointments to prevent ID leaking. (AC: B3/C5)
   */
  async getAppointmentById(appointmentId: number, userId: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patientProfile: { include: { user: true } },
        preTriage: true,
        consentRecord: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    const isPatientOwner = appointment.patientProfile?.userId === userId;
    const isDoctorOwner = appointment.doctorProfile?.userId === userId;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    return appointment;
  }

  async cancelAppointment(appointmentId: number, patientProfileId: number, reason?: string) {
    const updatedAppointment = await this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      if (!appointment || appointment.patientProfileId !== patientProfileId) {
        throw new NotFoundException({
          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
          message: 'Consulta não encontrada.',
        });
      }

      if (appointment.status === ConsultationStatus.CANCELADA) {
        return appointment;
      }

      if (
        appointment.status === ConsultationStatus.EM_ANDAMENTO ||
        appointment.status === ConsultationStatus.REALIZADA ||
        appointment.status === ConsultationStatus.NAO_REALIZADA
      ) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Não é possível cancelar uma consulta em andamento, finalizada ou não realizada.',
        });
      }

      const twelveHoursInMs = 12 * 60 * 60 * 1000;
      if (appointment.date.getTime() - Date.now() < twelveHoursInMs) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.',
        });
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { 
          status: ConsultationStatus.CANCELADA,
          cancellationReason: reason,
        },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      this.logger.log(`APPOINTMENT CANCELLED: ${appointmentId} by patient ${patientProfileId}`);
      return updated;
    });

    // Fire and forget email outside transaction
    if (updatedAppointment.doctorProfile?.user?.email && updatedAppointment.patientProfile) {
      this.mailService
        .sendCancellationToDoctor(
          updatedAppointment.doctorProfile.user.email,
          updatedAppointment.doctorProfile.name || 'Médico',
          updatedAppointment.patientProfile.name || 'Paciente',
          updatedAppointment.date,
          reason,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de cancelamento ao médico:', err));
    }

    return updatedAppointment;
  }

  async rescheduleAppointment(appointmentId: number, patientProfileId: number, newDateStr: string) {
    const { updatedAppointment, oldDate } = await this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      if (!appointment || appointment.patientProfileId !== patientProfileId) {
        throw new NotFoundException({
          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
          message: 'Consulta não encontrada.',
        });
      }

      if (appointment.status !== ConsultationStatus.AGENDADA) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Apenas consultas no status AGENDADA podem ser reagendadas.',
        });
      }

      const sixHoursInMs = 6 * 60 * 60 * 1000;
      if (appointment.date.getTime() - Date.now() < sixHoursInMs) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Reagendamentos só podem ser feitos com pelo menos 6 horas de antecedência.',
        });
      }

      const newDate = new Date(newDateStr);
      if (isNaN(newDate.getTime()) || newDate.getTime() < Date.now()) {
        throw new BadRequestException({
          code: DomainErrorCode.VALIDATION_ERROR,
          message: 'Nova data inválida ou no passado.',
        });
      }

      const previousDate = appointment.date;

      // Row-level lock on the doctor profile as well for double-booking prevention
      await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${appointment.doctorProfileId} FOR UPDATE`;

      // Check doctor availability slot matching
      const dayOfWeek = newDate.getUTCDay();
      const availabilities = await tx.availability.findMany({
        where: { doctorProfileId: appointment.doctorProfileId, dayOfWeek, isActive: true },
      });
      if (availabilities.length === 0) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O médico não possui agenda disponível para o dia da semana selecionado.',
        });
      }
      const hours = newDate.getUTCHours();
      const minutes = newDate.getUTCMinutes();
      const timeMinutes = hours * 60 + minutes;
      const isValidSlot = availabilities.some((slot) => {
        if (slot.slotDurationMinutes <= 0) return false;
        const [sH, sM] = slot.startTime.split(':').map(Number);
        const [eH, eM] = slot.endTime.split(':').map(Number);
        const startMin = sH * 60 + sM;
        const endMin = eH * 60 + eM;
        return timeMinutes >= startMin &&
               timeMinutes + slot.slotDurationMinutes <= endMin &&
               (timeMinutes - startMin) % slot.slotDurationMinutes === 0;
      });
      if (!isValidSlot) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O horário selecionado não corresponde a um intervalo válido na agenda do médico.',
        });
      }

      // Check doctor slot availability, excluding current appointment (autocollision check)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorProfileId: appointment.doctorProfileId,
          date: newDate,
          status: { not: ConsultationStatus.CANCELADA },
          id: { not: appointmentId },
        },
      });

      if (existingAppointment) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O novo horário selecionado não está mais disponível.',
        });
      }

      // Check patient double-booking, excluding current appointment
      const existingPatientAppointment = await tx.appointment.findFirst({
        where: {
          patientProfileId,
          date: newDate,
          status: { not: ConsultationStatus.CANCELADA },
          id: { not: appointmentId },
        },
      });

      if (existingPatientAppointment) {
        throw new BadRequestException({
          code: DomainErrorCode.SLOT_UNAVAILABLE,
          message: 'O paciente já possui uma consulta agendada para este horário.',
        });
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { 
          date: newDate,
          status: ConsultationStatus.AGENDADA,
        },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      this.logger.log(`APPOINTMENT RESCHEDULED: ${appointmentId} from ${previousDate} to ${newDate}`);
      return { updatedAppointment: updated, oldDate: previousDate };
    });

    // Fire and forget emails outside transaction
    if (updatedAppointment.patientProfile?.user?.email && updatedAppointment.doctorProfile) {
      this.mailService
        .sendRescheduleEmailToPatient(
          updatedAppointment.patientProfile.user.email,
          updatedAppointment.patientProfile.name || 'Paciente',
          updatedAppointment.doctorProfile.name || 'Médico',
          oldDate,
          updatedAppointment.date,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (paciente):', err));
    }

    if (updatedAppointment.doctorProfile?.user?.email && updatedAppointment.patientProfile) {
      this.mailService
        .sendRescheduleEmailToDoctor(
          updatedAppointment.doctorProfile.user.email,
          updatedAppointment.doctorProfile.name || 'Médico',
          updatedAppointment.patientProfile.name || 'Paciente',
          oldDate,
          updatedAppointment.date,
        )
        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (medico):', err));
    }

    return updatedAppointment;
  }

  /**
   * Enter the virtual waiting room. (AC: A1, A4/A9, A5, A7)
   * - Validates server-side that pre-triage and consent exist (A1)
   * - Idempotent for EM_ESPERA and EM_ANDAMENTO statuses (A4/A9)
   * - Enforces ±15 minute time window around scheduled time (A5)
   * - Uses row-level lock to prevent TOCTOU race conditions (A7)
   */
  async enterWaitingRoom(appointmentId: number, patientProfileId: number) {
    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      if (!appointment || appointment.patientProfileId !== patientProfileId) {
        throw new NotFoundException({
          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
          message: 'Consulta não encontrada.',
        });
      }

      const appointmentTime = appointment.date.getTime();
      const currentTime = Date.now();
      const fifteenMinutesInMs = 15 * 60 * 1000;

      // Idempotent: if already EM_ESPERA or EM_ANDAMENTO, return as-is after checking expiration (A4/A9, Blind-12)
      if (appointment.status === ConsultationStatus.EM_ESPERA) {
        if (currentTime > appointmentTime + fifteenMinutesInMs) {
          throw new BadRequestException({
            code: DomainErrorCode.INVALID_TRANSITION,
            message: 'O horário permitido para entrada na sala de espera já expirou.',
          });
        }
        return appointment;
      }
      if (appointment.status === ConsultationStatus.EM_ANDAMENTO) {
        return appointment;
      }

      if (appointment.status === ConsultationStatus.CANCELADA) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Não é possível entrar na sala de espera de uma consulta cancelada.',
        });
      }

      if (appointment.status !== ConsultationStatus.AGENDADA) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'AGENDADA'.`,
        });
      }

      // Server-side validation: pre-triage and consent must exist (A1)
      if (!appointment.preTriage) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'A pré-triagem deve ser preenchida antes de entrar na sala de espera.',
        });
      }

      if (!appointment.consentRecord) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'O consentimento deve ser registrado antes de entrar na sala de espera.',
        });
      }

      if (currentTime < appointmentTime - fifteenMinutesInMs) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'A sala de espera só pode ser acessada com no máximo 15 minutos de antecedência do horário agendado.',
        });
      }

      if (currentTime > appointmentTime + fifteenMinutesInMs) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'O horário permitido para entrada na sala de espera já expirou.',
        });
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: ConsultationStatus.EM_ESPERA },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      this.logger.log(`WAITING_ROOM_ENTERED: appointment=${appointmentId} patient=${patientProfileId}`);

      return updatedAppointment;
    });
  }

  /**
   * Mark appointment as no-show. (AC: A7)
   * Uses row-level lock to prevent TOCTOU race conditions.
   */
  async markNoShow(appointmentId: number, patientProfileId: number) {
    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      if (!appointment || appointment.patientProfileId !== patientProfileId) {
        throw new NotFoundException({
          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
          message: 'Consulta não encontrada.',
        });
      }

      if (appointment.status === ConsultationStatus.NAO_REALIZADA) {
        return appointment;
      }

      if (appointment.status !== ConsultationStatus.EM_ESPERA) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'EM_ESPERA'.`,
        });
      }

      const appointmentTime = appointment.date.getTime();
      const currentTime = Date.now();
      const tenMinutesInMs = 10 * 60 * 1000;

      if (currentTime < appointmentTime + tenMinutesInMs) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'A tolerância máxima para início da consulta ainda não expirou.',
        });
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: ConsultationStatus.NAO_REALIZADA },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      this.logger.log(`NO_SHOW_MARKED: appointment=${appointmentId} patient=${patientProfileId}`);

      return updatedAppointment;
    });
  }

  async startConsultation(appointmentId: number, doctorProfileId: number) {
    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      if (!appointment || appointment.doctorProfileId !== doctorProfileId) {
        throw new NotFoundException({
          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
          message: 'Consulta não encontrada.',
        });
      }

      if (appointment.status === ConsultationStatus.EM_ANDAMENTO) {
        return appointment;
      }

      if (appointment.status !== ConsultationStatus.EM_ESPERA && appointment.status !== ConsultationStatus.AGENDADA) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'EM_ESPERA' ou 'AGENDADA'.`,
        });
      }

      if (!appointment.preTriage || !appointment.consentRecord) {
        throw new BadRequestException({
          code: DomainErrorCode.INVALID_TRANSITION,
          message: 'Não é possível iniciar a consulta sem pré-triagem e consentimento preenchidos.',
        });
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: ConsultationStatus.EM_ANDAMENTO },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
          preTriage: true,
          consentRecord: true,
        },
      });

      this.logger.log(`CONSULTATION_STARTED: appointment=${appointmentId} doctor=${doctorProfileId}`);

      return updatedAppointment;
    });
  }
}

