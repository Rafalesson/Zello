import { Test, TestingModule } from '@nestjs/testing';
import { PreTriageService } from './pre-triage.service';
import { PrismaService } from '../prisma/prisma.service';
import { SymptomDuration } from '@prisma/client';

describe('PreTriageService', () => {
  let service: PreTriageService;

  const mockPrismaService = {
    runInTransactionWithLock: jest.fn().mockImplementation((id, callback) => callback(mockPrismaService)),
    appointment: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        status: 'AGENDADA',
        patientProfile: { id: 10, userId: 100 },
      }),
    },
    preTriage: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreTriageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PreTriageService>(PreTriageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdate', () => {
    const userId = 100;
    const appointmentId = 1;
    const dto = {
      symptoms: 'Dor de cabeça persistente e náusea',
      duration: SymptomDuration.ESTA_SEMANA,
      intensity: 3,
    };

    it('should create a new pre-triage record', async () => {
      const expectedResult = {
        id: 1,
        appointmentId,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.preTriage.upsert.mockResolvedValue(expectedResult);

      const result = await service.createOrUpdate(userId, appointmentId, dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.preTriage.upsert).toHaveBeenCalledWith({
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
    });

    it('should update an existing pre-triage record', async () => {
      const updatedDto = {
        symptoms: 'Sintomas atualizados',
        duration: SymptomDuration.MAIS_DE_UMA_SEMANA,
        intensity: 5,
      };

      const expectedResult = {
        id: 1,
        appointmentId,
        ...updatedDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.preTriage.upsert.mockResolvedValue(expectedResult);

      const result = await service.createOrUpdate(userId, appointmentId, updatedDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.preTriage.upsert).toHaveBeenCalledWith({
        where: { appointmentId },
        create: {
          appointmentId,
          symptoms: updatedDto.symptoms,
          duration: updatedDto.duration,
          intensity: updatedDto.intensity,
        },
        update: {
          symptoms: updatedDto.symptoms,
          duration: updatedDto.duration,
          intensity: updatedDto.intensity,
        },
      });
    });

    it('should validate symptoms with max 500 characters', async () => {
      const longSymptoms = 'A'.repeat(500);
      const validDto = { ...dto, symptoms: longSymptoms };
      const expectedResult = { id: 1, appointmentId, ...validDto, createdAt: new Date(), updatedAt: new Date() };

      mockPrismaService.preTriage.upsert.mockResolvedValue(expectedResult);

      const result = await service.createOrUpdate(userId, appointmentId, validDto);
      expect(result.symptoms).toHaveLength(500);
    });

    it('should accept all valid duration enum values', async () => {
      const durations = [
        SymptomDuration.HOJE,
        SymptomDuration.ONTEM,
        SymptomDuration.ESTA_SEMANA,
        SymptomDuration.MAIS_DE_UMA_SEMANA,
      ];

      for (const duration of durations) {
        const dtoWithDuration = { ...dto, duration };
        const expectedResult = { id: 1, appointmentId, ...dtoWithDuration, createdAt: new Date(), updatedAt: new Date() };

        mockPrismaService.preTriage.upsert.mockResolvedValue(expectedResult);

        const result = await service.createOrUpdate(userId, appointmentId, dtoWithDuration);
        expect(result.duration).toBe(duration);
      }
    });

    it('should accept intensity values from 1 to 10', async () => {
      for (let intensity = 1; intensity <= 10; intensity++) {
        const dtoWithIntensity = { ...dto, intensity };
        const expectedResult = { id: 1, appointmentId, ...dtoWithIntensity, createdAt: new Date(), updatedAt: new Date() };

        mockPrismaService.preTriage.upsert.mockResolvedValue(expectedResult);

        const result = await service.createOrUpdate(userId, appointmentId, dtoWithIntensity);
        expect(result.intensity).toBe(intensity);
      }
    });
  });

  describe('findByAppointmentId', () => {
    it('should return the pre-triage record for an appointment', async () => {
      const appointmentId = 1;
      const expectedResult = {
        id: 1,
        appointmentId,
        symptoms: 'Febre alta e dor no corpo',
        duration: SymptomDuration.ONTEM,
        intensity: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.preTriage.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findByAppointmentId(appointmentId);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.preTriage.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
    });

    it('should return null if no pre-triage exists for the appointment', async () => {
      const appointmentId = 999;

      mockPrismaService.preTriage.findUnique.mockResolvedValue(null);

      const result = await service.findByAppointmentId(appointmentId);

      expect(result).toBeNull();
      expect(mockPrismaService.preTriage.findUnique).toHaveBeenCalledWith({
        where: { appointmentId: 999 },
      });
    });
  });
});
