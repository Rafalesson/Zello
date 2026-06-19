import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DomainErrorCode } from '@imnotmedical/shared';
import { MailService } from '../mail/mail.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMailService = {
    sendBookingConfirmationToPatient: jest.fn().mockResolvedValue(undefined),
    sendBookingConfirmationToDoctor: jest.fn().mockResolvedValue(undefined),
    sendCancellationToDoctor: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 1;
    const createDto = {
      doctorProfileId: 1,
      date: '2026-06-10T10:00:00.000Z',
    };
    const appointmentDate = new Date(createDto.date);

    it('should successfully create an appointment', async () => {
      // Mock patient profile exists
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        patientProfile: { id: 2 },
      });

      // Mock no existing appointment
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      const expectedAppointment = {
        id: 1,
        doctorProfileId: 1,
        patientProfileId: 2,
        date: appointmentDate,
        status: 'AGENDADA',
        doctorProfile: { name: 'Dr. Test', user: { name: 'Dr. Test', email: 'doctor@test.com' } },
        patientProfile: { name: 'Paciente Test', user: { name: 'Paciente Test', email: 'patient@test.com' } },
      };
      mockPrismaService.appointment.create.mockResolvedValue(expectedAppointment);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(expectedAppointment);
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          doctorProfileId: 1,
          patientProfileId: 2,
          date: appointmentDate,
          status: 'AGENDADA',
        },
        include: {
          doctorProfile: { include: { user: true } },
          patientProfile: { include: { user: true } },
        },
      });
      expect(mockMailService.sendBookingConfirmationToPatient).toHaveBeenCalledWith(
        'patient@test.com',
        'Paciente Test',
        'Dr. Test',
        appointmentDate
      );
      expect(mockMailService.sendBookingConfirmationToDoctor).toHaveBeenCalledWith(
        'doctor@test.com',
        'Dr. Test',
        'Paciente Test',
        appointmentDate
      );
    });

    it('should successfully create an appointment even if mail service fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        patientProfile: { id: 2 },
      });
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      const expectedAppointment = {
        id: 1,
        doctorProfileId: 1,
        patientProfileId: 2,
        date: appointmentDate,
        status: 'AGENDADA',
        doctorProfile: { name: 'Dr. Test', user: { name: 'Dr. Test', email: 'doctor@test.com' } },
        patientProfile: { name: 'Paciente Test', user: { name: 'Paciente Test', email: 'patient@test.com' } },
      };
      mockPrismaService.appointment.create.mockResolvedValue(expectedAppointment);

      mockMailService.sendBookingConfirmationToPatient.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await service.create(userId, createDto);

      expect(result).toEqual(expectedAppointment);
    });

    it('should throw BadRequestException if patient profile is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        patientProfile: null,
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new BadRequestException('Usuário não possui perfil de paciente.')
      );
    });

    it('should throw BadRequestException with SLOT_UNAVAILABLE if slot is taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        patientProfile: { id: 2 },
      });

      // Mock existing appointment
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        id: 1,
        status: 'AGENDADA',
      });

      await expect(service.create(userId, createDto)).rejects.toMatchObject({
        response: {
          code: DomainErrorCode.SLOT_UNAVAILABLE,
        },
      });
    });
  });

  describe('getDoctorAppointments', () => {
    it('should successfully get and return appointments for a doctor sorted by date', async () => {
      const doctorProfileId = 1;
      const expectedAppointments = [
        {
          id: 1,
          doctorProfileId,
          patientProfileId: 10,
          date: new Date('2026-06-10T10:00:00.000Z'),
          status: 'AGENDADA',
          patientProfile: { id: 10, name: 'John Doe' },
        },
        {
          id: 2,
          doctorProfileId,
          patientProfileId: 11,
          date: new Date('2026-06-10T11:00:00.000Z'),
          status: 'AGENDADA',
          patientProfile: { id: 11, name: 'Jane Doe' },
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(expectedAppointments);

      const result = await service.getDoctorAppointments(doctorProfileId);

      expect(result).toEqual(expectedAppointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          doctorProfileId,
          date: {
            gte: expect.any(Date),
          },
        },
        include: {
          patientProfile: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
    });
  });

  describe('getPatientAppointments', () => {
    it('should successfully get and return appointments for a patient sorted by date', async () => {
      const patientProfileId = 2;
      const expectedAppointments = [
        {
          id: 1,
          doctorProfileId: 1,
          patientProfileId,
          date: new Date('2026-06-10T10:00:00.000Z'),
          status: 'AGENDADA',
          doctorProfile: { id: 1, name: 'Dr. Test', specialty: 'Cardiologia' },
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(expectedAppointments);

      const result = await service.getPatientAppointments(patientProfileId);

      expect(result).toEqual(expectedAppointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { patientProfileId },
        include: { doctorProfile: true },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('cancelAppointment', () => {
    const appointmentId = 1;
    const patientProfileId = 2;

    it('should throw ForbiddenException if appointment does not belong to patient', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        patientProfileId: 999, // different patient
      });

      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
        'Você não tem permissão para cancelar esta consulta.'
      );
    });

    it('should throw BadRequestException if appointment is less than 12 hours away', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        patientProfileId,
        date: new Date(new Date().getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
      });

      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
        'Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.'
      );
    });

    it('should throw BadRequestException if already cancelled', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: appointmentId,
        patientProfileId,
        status: 'CANCELADA',
      });

      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
        'A consulta já está cancelada.'
      );
    });

    it('should cancel appointment and send email', async () => {
      const futureDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const appointmentMock = {
        id: appointmentId,
        patientProfileId,
        date: futureDate,
        status: 'AGENDADA',
        patientProfile: { name: 'Paciente Test' },
        doctorProfile: { user: { email: 'doctor@test.com' }, name: 'Dr. Test' },
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointmentMock);
      mockPrismaService.appointment.update.mockResolvedValue({ ...appointmentMock, status: 'CANCELADA' });

      const result = await service.cancelAppointment(appointmentId, patientProfileId);

      expect(result.status).toBe('CANCELADA');
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: 'CANCELADA', cancellationReason: undefined },
      });
      expect(mockMailService.sendCancellationToDoctor).toHaveBeenCalledWith(
        'doctor@test.com',
        'Dr. Test',
        'Paciente Test',
        futureDate,
        undefined
      );
    });
  });
});
