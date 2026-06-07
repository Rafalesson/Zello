import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    doctorProfile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchDoctors', () => {
    it('should return a list of doctors with computed next available slot', async () => {
      const mockDoctors = [
        {
          id: 1,
          name: 'Dra. Helena Sampaio',
          crm: 'CRM 123456-SP',
          specialty: 'Cardiologista',
          bio: 'Bio Dra Helena',
          profilePictureUrl: 'url-helena',
          address: { city: 'São Paulo', state: 'SP' },
          availabilities: [
            {
              dayOfWeek: 1, // Monday
              startTime: '09:00',
              endTime: '12:00',
              isActive: true,
            },
          ],
        },
      ];

      mockPrismaService.doctorProfile.findMany.mockResolvedValue(mockDoctors);

      const result = await service.searchDoctors({ specialty: 'Cardiologista' });

      expect(prisma.doctorProfile.findMany).toHaveBeenCalledWith({
        where: {
          status: 'APPROVED',
          user: { isActive: true },
          specialty: { equals: 'Cardiologista', mode: 'insensitive' },
        },
        select: expect.any(Object),
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dra. Helena Sampaio');
      expect(result[0].nextAvailable).toBeDefined();
      expect(result[0].nextAvailableDate).toBeDefined();
    });

    it('should query with term, city, and state filters', async () => {
      mockPrismaService.doctorProfile.findMany.mockResolvedValue([]);

      await service.searchDoctors({ query: 'Helena', city: 'São Paulo', state: 'SP' });

      expect(prisma.doctorProfile.findMany).toHaveBeenCalledWith({
        where: {
          status: 'APPROVED',
          user: { isActive: true },
          address: {
            city: { equals: 'São Paulo', mode: 'insensitive' },
            state: { equals: 'SP', mode: 'insensitive' },
          },
          OR: [
            { name: { contains: 'Helena', mode: 'insensitive' } },
            { bio: { contains: 'Helena', mode: 'insensitive' } },
            { specialty: { contains: 'Helena', mode: 'insensitive' } },
          ],
        },
        select: expect.any(Object),
      });
    });
  });
});
