import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from './consent.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockPrismaService = {
    consentRecord: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    legalTerms: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const appointmentId = 1;
    const accepted = true;
    const termsVersion = 'v1.0';
    const ipAddress = '192.168.1.1';
    const userAgent = 'Mozilla/5.0';

    it('should create a consent record with all audit data', async () => {
      const expectedResult = {
        id: 1,
        appointmentId,
        accepted,
        termsVersion,
        ipAddress,
        userAgent,
        acceptedAt: new Date(),
      };

      mockPrismaService.consentRecord.create.mockResolvedValue(expectedResult);

      const result = await service.create(
        appointmentId,
        accepted,
        termsVersion,
        ipAddress,
        userAgent,
      );

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.consentRecord.create).toHaveBeenCalledWith({
        data: {
          appointmentId,
          accepted,
          termsVersion,
          ipAddress,
          userAgent,
        },
      });
    });

    it('should create a consent record with null IP and User-Agent', async () => {
      const expectedResult = {
        id: 2,
        appointmentId,
        accepted,
        termsVersion,
        ipAddress: null,
        userAgent: null,
        acceptedAt: new Date(),
      };

      mockPrismaService.consentRecord.create.mockResolvedValue(expectedResult);

      const result = await service.create(
        appointmentId,
        accepted,
        termsVersion,
        null,
        null,
      );

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.consentRecord.create).toHaveBeenCalledWith({
        data: {
          appointmentId,
          accepted,
          termsVersion,
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should propagate database errors', async () => {
      mockPrismaService.consentRecord.create.mockRejectedValue(
        new Error('Unique constraint violation'),
      );

      await expect(
        service.create(appointmentId, accepted, termsVersion, ipAddress, userAgent),
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('findByAppointmentId', () => {
    it('should return the consent record for an appointment', async () => {
      const appointmentId = 1;
      const expectedResult = {
        id: 1,
        appointmentId,
        accepted: true,
        termsVersion: 'v1.0',
        ipAddress: '10.0.0.1',
        userAgent: 'TestAgent/1.0',
        acceptedAt: new Date(),
      };

      mockPrismaService.consentRecord.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findByAppointmentId(appointmentId);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.consentRecord.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
    });

    it('should return null if no consent exists for the appointment', async () => {
      const appointmentId = 999;

      mockPrismaService.consentRecord.findUnique.mockResolvedValue(null);

      const result = await service.findByAppointmentId(appointmentId);

      expect(result).toBeNull();
      expect(mockPrismaService.consentRecord.findUnique).toHaveBeenCalledWith({
        where: { appointmentId: 999 },
      });
    });
  });

  describe('getActiveTerms', () => {
    it('should return the active legal terms', async () => {
      const expectedTerms = {
        id: 1,
        version: 'v1.0',
        content: 'Conteúdo Legal de Teste',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.legalTerms.findFirst.mockResolvedValue(expectedTerms);

      const result = await service.getActiveTerms();

      expect(result).toEqual(expectedTerms);
      expect(mockPrismaService.legalTerms.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
