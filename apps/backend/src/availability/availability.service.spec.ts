// Endereço: apps/backend/src/availability/availability.service.spec.ts
import { BadRequestException } from '@nestjs/common';
import {
  AvailabilityService,
  generateSlotsFromRange,
} from './availability.service';

describe('generateSlotsFromRange', () => {
  it('should generate correct slots from 07:00 to 17:00', () => {
    const slots = generateSlotsFromRange(1, '07:00', '17:00');
    expect(slots).toHaveLength(10);
    expect(slots[0]).toEqual({
      dayOfWeek: 1,
      startTime: '07:00',
      endTime: '08:00',
      slotDurationMinutes: 60,
      isActive: true,
    });
    expect(slots[9]).toEqual({
      dayOfWeek: 1,
      startTime: '16:00',
      endTime: '17:00',
      slotDurationMinutes: 60,
      isActive: true,
    });
  });

  it('should generate correct slots from 14:30 to 19:00', () => {
    const slots = generateSlotsFromRange(2, '14:30', '19:00');
    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.startTime)).toEqual([
      '14:30',
      '15:30',
      '16:30',
      '17:30',
    ]);
    expect(slots.map((s) => s.endTime)).toEqual([
      '15:30',
      '16:30',
      '17:30',
      '18:30',
    ]);
  });

  it('should return empty array when interval is less than 60 min', () => {
    const slots = generateSlotsFromRange(3, '10:00', '10:30');
    expect(slots).toHaveLength(0);
  });

  it('should generate exactly 1 slot for a 60-min interval', () => {
    const slots = generateSlotsFromRange(4, '09:00', '10:00');
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[0].endTime).toBe('10:00');
  });

  it('should handle non-aligned times correctly (08:15 to 11:45)', () => {
    // 08:15→09:15, 09:15→10:15, 10:15→11:15 (11:15+60=11:75>11:45, stops)
    const slots = generateSlotsFromRange(5, '08:15', '11:45');
    expect(slots).toHaveLength(3);
    expect(slots[0].startTime).toBe('08:15');
    expect(slots[2].endTime).toBe('11:15');
  });
});

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      availability: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new AvailabilityService(mockPrisma);
  });

  describe('getByDoctor', () => {
    it('should return availability slots ordered by dayOfWeek and startTime', async () => {
      const mockSlots = [
        {
          id: 1,
          doctorProfileId: 10,
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
          isActive: true,
        },
        {
          id: 2,
          doctorProfileId: 10,
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '15:00',
          slotDurationMinutes: 60,
          isActive: true,
        },
      ];
      mockPrisma.availability.findMany.mockResolvedValue(mockSlots);

      const result = await service.getByDoctor(10);

      expect(result).toEqual(mockSlots);
      expect(mockPrisma.availability.findMany).toHaveBeenCalledWith({
        where: { doctorProfileId: 10 },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  });

  describe('upsert', () => {
    it('should save a valid schedule and return persisted data', async () => {
      const validSlots = [
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
        },
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          slotDurationMinutes: 60,
        },
      ];

      const createdSlots = validSlots.map((s, i) => ({
        id: i + 1,
        doctorProfileId: 10,
        ...s,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          availability: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
            findMany: jest.fn().mockResolvedValue(createdSlots),
          },
        };
        return callback(tx);
      });

      const result = await service.upsert(10, validSlots);

      expect(result).toEqual(createdSlots);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when endTime is before startTime', async () => {
      const invalidSlots = [
        {
          dayOfWeek: 1,
          startTime: '14:00',
          endTime: '08:00',
          slotDurationMinutes: 60,
        },
      ];

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        /Horário de término.*deve ser posterior/,
      );
    });

    it('should throw BadRequestException when endTime equals startTime', async () => {
      const invalidSlots = [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
        },
      ];

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when dayOfWeek is invalid', async () => {
      const invalidSlots = [
        {
          dayOfWeek: 7,
          startTime: '08:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
        },
      ];

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        /Dia da semana inválido/,
      );
    });

    it('should throw BadRequestException when dayOfWeek is negative', async () => {
      const invalidSlots = [
        {
          dayOfWeek: -1,
          startTime: '08:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
        },
      ];

      await expect(service.upsert(10, invalidSlots)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty slots array (clear all availability)', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          availability: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
        };
        return callback(tx);
      });

      const result = await service.upsert(10, []);

      expect(result).toEqual([]);
    });

    it('should throw BadRequestException when slots overlap on the same day', async () => {
      const overlappingSlots = [
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:30',
          slotDurationMinutes: 60,
        },
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          slotDurationMinutes: 60,
        },
      ];

      await expect(service.upsert(10, overlappingSlots)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.upsert(10, overlappingSlots)).rejects.toThrow(
        /Sobreposição/,
      );
    });

    it('should allow non-overlapping slots on the same day', async () => {
      const validSlots = [
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:00',
          slotDurationMinutes: 60,
        },
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          slotDurationMinutes: 60,
        },
        {
          dayOfWeek: 1,
          startTime: '14:00',
          endTime: '15:00',
          slotDurationMinutes: 60,
        },
      ];

      const createdSlots = validSlots.map((s, i) => ({
        id: i + 1,
        doctorProfileId: 10,
        ...s,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          availability: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 3 }),
            findMany: jest.fn().mockResolvedValue(createdSlots),
          },
        };
        return callback(tx);
      });

      const result = await service.upsert(10, validSlots);
      expect(result).toEqual(createdSlots);
    });
  });

  describe('upsertFromRanges', () => {
    it('should generate and persist slots from valid ranges', async () => {
      const ranges = [
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '17:00' },
      ];

      // 08:00-12:00 → 4 slots, 14:00-17:00 → 3 slots = 7 total
      const expectedSlotCount = 7;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          availability: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({
              count: expectedSlotCount,
            }),
            findMany: jest.fn().mockResolvedValue(
              Array.from({ length: expectedSlotCount }, (_, i) => ({
                id: i + 1,
                doctorProfileId: 10,
                isActive: true,
              })),
            ),
          },
        };
        return callback(tx);
      });

      const result = await service.upsertFromRanges(10, ranges);
      expect(result).toHaveLength(expectedSlotCount);
    });

    it('should throw when range is too short for any slot', async () => {
      const ranges = [
        { dayOfWeek: 1, startTime: '08:00', endTime: '08:30' },
      ];

      await expect(service.upsertFromRanges(10, ranges)).rejects.toThrow(
        /curto demais/,
      );
    });

    it('should throw when endTime is before startTime', async () => {
      const ranges = [
        { dayOfWeek: 1, startTime: '18:00', endTime: '08:00' },
      ];

      await expect(service.upsertFromRanges(10, ranges)).rejects.toThrow(
        /deve ser posterior/,
      );
    });

    it('should throw when dayOfWeek is invalid', async () => {
      const ranges = [
        { dayOfWeek: 8, startTime: '08:00', endTime: '12:00' },
      ];

      await expect(service.upsertFromRanges(10, ranges)).rejects.toThrow(
        /Dia da semana inválido/,
      );
    });
  });
});
