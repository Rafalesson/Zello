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
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockMailService = {
    sendBookingConfirmationToPatient: jest.fn().mockResolvedValue(undefined),
    sendBookingConfirmationToDoctor: jest.fn().mockResolvedValue(undefined),
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
});
