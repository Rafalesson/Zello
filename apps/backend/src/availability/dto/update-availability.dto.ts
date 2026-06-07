// Endereço: apps/backend/src/availability/dto/update-availability.dto.ts
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime: string;

  @IsInt()
  @IsIn([15, 30, 45, 60], {
    message: 'slotDurationMinutes deve ser 15, 30, 45 ou 60',
  })
  @IsOptional()
  slotDurationMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}

/**
 * DTO para definir disponibilidade via faixas de horário.
 * O backend auto-gera slots de 60 min dentro de cada faixa.
 */
export class AvailabilityRangeDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime: string;
}

export class UpdateAvailabilityRangesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRangeDto)
  ranges: AvailabilityRangeDto[];
}

