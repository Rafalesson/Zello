import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DomainErrorCode } from '@imnotmedical/shared';
import { MailService } from '../mail/mail.service';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    availability: { findMany: jest.fn() },
    appointment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
    $executeRaw: jest.fn().mockResolvedValue([]),
    runInTransactionWithLock: jest.fn(async (_id, cb) => cb(mockPrismaService)),
  };

  const mockMailService = {
    sendBookingConfirmationToPatient: jest.fn().mockResolvedValue(undefined),
    sendBookingConfirmationToDoctor: jest.fn().mockResolvedValue(undefined),
    sendCancellationToDoctor: jest.fn().mockResolvedValue(undefined),
    sendRescheduleEmailToPatient: jest.fn().mockResolvedValue(undefined),
    sendRescheduleEmailToDoctor: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => { jest.clearAllMocks(); });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('create', () => {
    const userId = 1;
    const createDto = { doctorProfileId: 1, date: '2030-06-10T10:00:00.000Z' };
    const appointmentDate = new Date(createDto.date);

    it('should successfully create an appointment', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: { id: 2 } });
      mockPrismaService.availability.findMany.mockResolvedValue([{ startTime: '08:00', endTime: '18:00', slotDurationMinutes: 30 }]);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      const expected = {
        id: 1, doctorProfileId: 1, patientProfileId: 2, date: appointmentDate, status: 'AGENDADA',
        doctorProfile: { name: 'Dr. Test', user: { name: 'Dr. Test', email: 'doctor@test.com' } },
        patientProfile: { name: 'Paciente Test', user: { name: 'Paciente Test', email: 'patient@test.com' } },
      };
      mockPrismaService.appointment.create.mockResolvedValue(expected);
      const result = await service.create(userId, createDto);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException if patient profile is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: null });
      await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with SLOT_UNAVAILABLE if slot is taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: { id: 2 } });
      mockPrismaService.availability.findMany.mockResolvedValue([{ startTime: '08:00', endTime: '18:00', slotDurationMinutes: 30 }]);
      mockPrismaService.appointment.findFirst.mockResolvedValue({ id: 1, status: 'AGENDADA' });
      await expect(service.create(userId, createDto)).rejects.toMatchObject({ response: { code: DomainErrorCode.SLOT_UNAVAILABLE } });
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment when user is the patient owner', async () => {
      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.getAppointmentById(1, 10);
      expect(result).toEqual(mock);
    });

    it('should return appointment when user is the doctor owner', async () => {
      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.getAppointmentById(1, 20);
      expect(result).toEqual(mock);
    });

    it('should throw NotFoundException when appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);
      await expect(service.getAppointmentById(999, 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not the owner (prevents ID leaking)', async () => {
      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      await expect(service.getAppointmentById(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDoctorAppointments', () => {
    it('should return appointments using UTC-normalized date', async () => {
      const expected = [{ id: 1, date: new Date('2030-06-10T10:00:00.000Z'), status: 'AGENDADA' }];
      mockPrismaService.appointment.findMany.mockResolvedValue(expected);
      const result = await service.getDoctorAppointments(1);
      expect(result).toEqual(expected);
      const call = mockPrismaService.appointment.findMany.mock.calls[0][0];
      expect(call.where.date.gte).toBeInstanceOf(Date);
      // Verify the date is at midnight UTC (hours=0, minutes=0)
      expect(call.where.date.gte.getUTCHours()).toBe(0);
      expect(call.where.date.gte.getUTCMinutes()).toBe(0);
    });
  });

  describe('cancelAppointment', () => {
    const appointmentId = 1;
    const patientProfileId = 2;

    it('should use runInTransactionWithLock', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, date: futureDate, status: 'AGENDADA',
        patientProfile: { name: 'P' }, doctorProfile: { user: { email: 'doc@t.com' }, name: 'D' },
      });
      mockPrismaService.appointment.update.mockResolvedValue({ status: 'CANCELADA' });
      await service.cancelAppointment(appointmentId, patientProfileId);
      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
    });

    it('should throw NotFoundException if not owner', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({ id: appointmentId, patientProfileId: 999 });
      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(NotFoundException);
    });

    it('should return idempotently if already cancelled', async () => {
      const mock = { id: appointmentId, patientProfileId, status: 'CANCELADA' };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.cancelAppointment(appointmentId, patientProfileId);
      expect(result).toEqual(mock);
    });

    it('should send cancellation email outside transaction when cancelled', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const updatedMock = {
        id: appointmentId, patientProfileId, date: futureDate, status: 'CANCELADA',
        patientProfile: { name: 'Paciente' }, doctorProfile: { name: 'Doctor', user: { email: 'doc@t.com' } },
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, date: futureDate, status: 'AGENDADA',
        patientProfile: { name: 'Paciente' }, doctorProfile: { name: 'Doctor', user: { email: 'doc@t.com' } },
      });
      mockPrismaService.appointment.update.mockResolvedValue(updatedMock);
      await service.cancelAppointment(appointmentId, patientProfileId, 'Imprevisto');
      expect(mockMailService.sendCancellationToDoctor).toHaveBeenCalledWith('doc@t.com', 'Doctor', 'Paciente', futureDate, 'Imprevisto');
    });
  });

  describe('rescheduleAppointment', () => {
    const appointmentId = 1;
    const patientProfileId = 2;
    const newDateStr = '2030-06-15T10:00:00.000Z';

    it('should reschedule successfully and send emails outside transaction', async () => {
      const oldDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newDate = new Date(newDateStr);
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, doctorProfileId: 10, date: oldDate, status: 'AGENDADA',
        doctorProfile: { name: 'Doctor', user: { email: 'doc@t.com' } },
        patientProfile: { name: 'Paciente', user: { email: 'pat@t.com' } },
      });
      mockPrismaService.availability.findMany.mockResolvedValue([{ startTime: '08:00', endTime: '18:00', slotDurationMinutes: 30 }]);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      const updatedMock = {
        id: appointmentId, patientProfileId, doctorProfileId: 10, date: newDate, status: 'AGENDADA',
        doctorProfile: { name: 'Doctor', user: { email: 'doc@t.com' } },
        patientProfile: { name: 'Paciente', user: { email: 'pat@t.com' } },
      };
      mockPrismaService.appointment.update.mockResolvedValue(updatedMock);

      const result = await service.rescheduleAppointment(appointmentId, patientProfileId, newDateStr);
      expect(result).toEqual(updatedMock);
      expect(mockMailService.sendRescheduleEmailToPatient).toHaveBeenCalledWith('pat@t.com', 'Paciente', 'Doctor', oldDate, newDate);
      expect(mockMailService.sendRescheduleEmailToDoctor).toHaveBeenCalledWith('doc@t.com', 'Doctor', 'Paciente', oldDate, newDate);
    });

    it('should throw BadRequestException when status is not AGENDADA', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'EM_ANDAMENTO', date: new Date(Date.now() + 24 * 3600 * 1000),
      });
      await expect(service.rescheduleAppointment(appointmentId, patientProfileId, newDateStr)).rejects.toMatchObject({ response: { code: DomainErrorCode.INVALID_TRANSITION } });
    });
  });

  describe('enterWaitingRoom', () => {
    const appointmentId = 1;
    const patientProfileId = 2;

    it('should validate pre-triage and consent exist before entering', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
        preTriage: null, consentRecord: null,
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toThrow(BadRequestException);
    });

    it('should validate consent exists', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
        preTriage: { id: 1 }, consentRecord: null,
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toThrow(BadRequestException);
    });

    it('should transition from AGENDADA to EM_ESPERA within time window', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
        preTriage: { id: 1 }, consentRecord: { id: 1 },
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      mockPrismaService.appointment.update.mockResolvedValue({ status: 'EM_ESPERA' });
      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
      expect(result.status).toBe('EM_ESPERA');
      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
    });

    it('should return idempotently if status is EM_ESPERA', async () => {
      const mock = { id: appointmentId, patientProfileId, status: 'EM_ESPERA', date: new Date(), preTriage: { id: 1 }, consentRecord: { id: 1 } };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
      expect(result).toEqual(mock);
    });

    it('should return idempotently if status is EM_ANDAMENTO', async () => {
      const mock = { id: appointmentId, patientProfileId, status: 'EM_ANDAMENTO', date: new Date(), preTriage: { id: 1 }, consentRecord: { id: 1 } };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
      expect(result).toEqual(mock);
    });

    it('should throw if entering more than 15 minutes before scheduled time', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA',
        date: new Date(Date.now() + 30 * 60 * 1000),
        preTriage: { id: 1 }, consentRecord: { id: 1 },
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });

    it('should throw if entering more than 15 minutes after scheduled time', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA',
        date: new Date(Date.now() - 20 * 60 * 1000),
        preTriage: { id: 1 }, consentRecord: { id: 1 },
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });

    it('should throw NotFoundException if not owner', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId: 999, status: 'AGENDADA', date: new Date(),
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'CONSULTATION_NOT_FOUND' } });
    });

    it('should throw BadRequestException if CANCELADA', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'CANCELADA', date: new Date(),
      });
      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });
  });

  describe('markNoShow', () => {
    const appointmentId = 1;
    const patientProfileId = 2;

    it('should transition from EM_ESPERA to NAO_REALIZADA using lock', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'EM_ESPERA',
        date: new Date(Date.now() - 15 * 60 * 1000),
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      mockPrismaService.appointment.update.mockResolvedValue({ status: 'NAO_REALIZADA' });
      const result = await service.markNoShow(appointmentId, patientProfileId);
      expect(result.status).toBe('NAO_REALIZADA');
      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
    });

    it('should return idempotently if NAO_REALIZADA', async () => {
      const mock = { id: appointmentId, patientProfileId, status: 'NAO_REALIZADA', date: new Date(Date.now() - 15 * 60 * 1000) };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.markNoShow(appointmentId, patientProfileId);
      expect(result).toEqual(mock);
    });

    it('should throw if not EM_ESPERA', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(Date.now() - 15 * 60 * 1000),
      });
      await expect(service.markNoShow(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });

    it('should throw if before 10 min tolerance', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, patientProfileId, status: 'EM_ESPERA', date: new Date(),
      });
      await expect(service.markNoShow(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });
  });

  describe('startConsultation', () => {
    const appointmentId = 1;
    const doctorProfileId = 1;

    it('should transition from EM_ESPERA to EM_ANDAMENTO using lock', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, doctorProfileId, status: 'EM_ESPERA', date: new Date(),
        preTriage: { id: 1 }, consentRecord: { id: 1 },
        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
      });
      mockPrismaService.appointment.update.mockResolvedValue({ status: 'EM_ANDAMENTO' });
      const result = await service.startConsultation(appointmentId, doctorProfileId);
      expect(result.status).toBe('EM_ANDAMENTO');
      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
    });

    it('should return idempotently if EM_ANDAMENTO', async () => {
      const mock = { id: appointmentId, doctorProfileId, status: 'EM_ANDAMENTO', date: new Date() };
      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
      const result = await service.startConsultation(appointmentId, doctorProfileId);
      expect(result).toEqual(mock);
    });

    it('should throw if CANCELADA', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId, doctorProfileId, status: 'CANCELADA', date: new Date(),
        preTriage: { id: 1 }, consentRecord: { id: 1 },
      });
      await expect(service.startConsultation(appointmentId, doctorProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });
  });
});
