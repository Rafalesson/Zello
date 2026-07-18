import { Test, TestingModule } from '@nestjs/testing';
import { ConsentController } from './consent.controller';
import { ConsentTermsController } from './consent-terms.controller';
import { ConsentService } from './consent.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('Consent Integration', () => {
  let consentController: ConsentController;
  let consentTermsController: ConsentTermsController;
  let consentService: ConsentService;

  const mockPrismaService = {
    consentRecord: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    legalTerms: {
      findFirst: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentController, ConsentTermsController],
      providers: [
        ConsentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    consentController = module.get<ConsentController>(ConsentController);
    consentTermsController = module.get<ConsentTermsController>(ConsentTermsController);
    consentService = module.get<ConsentService>(ConsentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /consent/active-terms', () => {
    it('should return the active terms if found', async () => {
      const activeTerms = {
        id: 1,
        version: 'v1.0',
        content: 'Termos Legais Ativos',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.legalTerms.findFirst.mockResolvedValue(activeTerms);

      const result = await consentTermsController.getActiveTerms();
      expect(result).toEqual(activeTerms);
    });

    it('should throw NotFoundException if no active terms exist', async () => {
      mockPrismaService.legalTerms.findFirst.mockResolvedValue(null);

      await expect(consentTermsController.getActiveTerms()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /appointments/:id/consent', () => {
    const req = {
      user: { id: 10, role: 'PATIENT' },
      headers: {
        'x-forwarded-for': '192.168.0.1',
        'user-agent': 'Chrome/100',
      },
    };

    const appointment = {
      id: 1,
      status: 'AGENDADA',
      patientProfile: {
        id: 5,
        userId: 10,
      },
    };

    const activeTerms = {
      id: 1,
      version: 'v1.0',
      content: 'Termos Legais Ativos',
      isActive: true,
    };

    it('should successfully submit consent when version matches active version', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.consentRecord.findUnique.mockResolvedValue(null); // No existing consent
      mockPrismaService.legalTerms.findFirst.mockResolvedValue(activeTerms);

      const createdRecord = {
        id: 100,
        appointmentId: 1,
        accepted: true,
        termsVersion: 'v1.0',
        ipAddress: '192.168.0.1',
        userAgent: 'Chrome/100',
        acceptedAt: new Date(),
      };
      mockPrismaService.consentRecord.create.mockResolvedValue(createdRecord);

      const dto = {
        accepted: true,
        termsVersion: 'v1.0',
      };

      const result = await consentController.createConsent(req as any, 1, dto);
      expect(result).toEqual(createdRecord);
    });

    it('should throw BadRequestException when submitted terms version does not match active version', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.consentRecord.findUnique.mockResolvedValue(null);
      mockPrismaService.legalTerms.findFirst.mockResolvedValue(activeTerms);

      const dto = {
        accepted: true,
        termsVersion: 'v0.9-outdated',
      };

      await expect(
        consentController.createConsent(req as any, 1, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if consent was already submitted', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.consentRecord.findUnique.mockResolvedValue({ id: 100 }); // Existing consent

      const dto = {
        accepted: true,
        termsVersion: 'v1.0',
      };

      await expect(
        consentController.createConsent(req as any, 1, dto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
