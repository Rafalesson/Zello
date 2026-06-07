// Endereço: apps/backend/src/availability/availability.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AvailabilitySlotDto,
  AvailabilityRangeDto,
} from './dto/update-availability.dto';

const SLOT_DURATION_MINUTES = 60;

/**
 * Converte string HH:mm em total de minutos desde meia-noite.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte total de minutos desde meia-noite em string HH:mm.
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Gera os slots individuais a partir de um range (startTime–endTime)
 * com intervalo fixo de SLOT_DURATION_MINUTES (60 min).
 *
 * Ex.: 14:30–19:00 → [14:30, 15:30, 16:30, 17:30, 18:30]
 * Cada slot dura SLOT_DURATION_MINUTES. O último slot deve terminar
 * até endTime, então o último início possível = endTime − duração.
 */
export function generateSlotsFromRange(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): AvailabilitySlotDto[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots: AvailabilitySlotDto[] = [];

  for (let t = startMin; t + SLOT_DURATION_MINUTES <= endMin; t += SLOT_DURATION_MINUTES) {
    slots.push({
      dayOfWeek,
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + SLOT_DURATION_MINUTES),
      slotDurationMinutes: SLOT_DURATION_MINUTES,
      isActive: true,
    });
  }

  return slots;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna todos os slots de disponibilidade de um médico.
   */
  async getByDoctor(doctorProfileId: number) {
    return this.prisma.availability.findMany({
      where: { doctorProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Recebe ranges de disponibilidade (startTime/endTime por dia),
   * gera os slots de 60 min automaticamente, valida e persiste.
   */
  async upsertFromRanges(
    doctorProfileId: number,
    ranges: AvailabilityRangeDto[],
  ) {
    const allSlots: AvailabilitySlotDto[] = [];

    for (const range of ranges) {
      if (range.dayOfWeek < 0 || range.dayOfWeek > 6) {
        throw new BadRequestException(
          `Dia da semana inválido: ${range.dayOfWeek}. Deve ser entre 0 (Domingo) e 6 (Sábado).`,
        );
      }

      if (range.endTime <= range.startTime) {
        throw new BadRequestException(
          `Horário de término (${range.endTime}) deve ser posterior ao horário de início (${range.startTime}) para o dia ${range.dayOfWeek}.`,
        );
      }

      const generated = generateSlotsFromRange(
        range.dayOfWeek,
        range.startTime,
        range.endTime,
      );

      if (generated.length === 0) {
        throw new BadRequestException(
          `O intervalo ${range.startTime}–${range.endTime} no dia ${range.dayOfWeek} é curto demais para gerar pelo menos um slot de ${SLOT_DURATION_MINUTES} minutos.`,
        );
      }

      allSlots.push(...generated);
    }

    // Validação de sobreposição dentro do mesmo dia
    this.validateNoOverlap(allSlots);

    return this.persistSlots(doctorProfileId, allSlots);
  }

  /**
   * Recebe slots individuais (legado/manual) e persiste diretamente.
   */
  async upsert(doctorProfileId: number, slots: AvailabilitySlotDto[]) {
    // Validação de negócio: endTime deve ser posterior a startTime
    for (const slot of slots) {
      if (slot.endTime <= slot.startTime) {
        throw new BadRequestException(
          `Horário de término (${slot.endTime}) deve ser posterior ao horário de início (${slot.startTime}) para o dia ${slot.dayOfWeek}.`,
        );
      }

      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new BadRequestException(
          `Dia da semana inválido: ${slot.dayOfWeek}. Deve ser entre 0 (Domingo) e 6 (Sábado).`,
        );
      }
    }

    // Validação de sobreposição
    this.validateNoOverlap(slots);

    return this.persistSlots(doctorProfileId, slots);
  }

  /**
   * Verifica que não há sobreposição de slots no mesmo dia.
   */
  private validateNoOverlap(slots: AvailabilitySlotDto[]) {
    const byDay = new Map<number, AvailabilitySlotDto[]>();
    for (const slot of slots) {
      const existing = byDay.get(slot.dayOfWeek) || [];
      existing.push(slot);
      byDay.set(slot.dayOfWeek, existing);
    }

    for (const [day, daySlots] of byDay) {
      const sorted = daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          throw new BadRequestException(
            `Sobreposição de horários detectada no dia ${day}: slot ${sorted[i - 1].startTime}–${sorted[i - 1].endTime} conflita com ${sorted[i].startTime}–${sorted[i].endTime}.`,
          );
        }
      }
    }
  }

  /**
   * Persiste os slots no banco, substituindo todos os existentes do médico.
   */
  private async persistSlots(
    doctorProfileId: number,
    slots: AvailabilitySlotDto[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Remove todos os slots existentes do médico
      await tx.availability.deleteMany({
        where: { doctorProfileId },
      });

      // Cria os novos slots
      if (slots.length === 0) {
        return [];
      }

      await tx.availability.createMany({
        data: slots.map((slot) => ({
          doctorProfileId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDurationMinutes: slot.slotDurationMinutes ?? SLOT_DURATION_MINUTES,
          isActive: slot.isActive ?? true,
        })),
      });

      // Retorna os slots recém-criados
      return tx.availability.findMany({
        where: { doctorProfileId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }
}
