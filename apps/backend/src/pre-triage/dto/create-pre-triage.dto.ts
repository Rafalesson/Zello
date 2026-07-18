import { IsNotEmpty, IsString, MaxLength, IsEnum, IsInt, Min, Max } from 'class-validator';
import { SymptomDuration } from '@prisma/client';

export class CreatePreTriageDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição dos sintomas é obrigatória.' })
  @MaxLength(500, { message: 'A descrição dos sintomas deve ter no máximo 500 caracteres.' })
  symptoms: string;

  @IsEnum(SymptomDuration, { message: 'A duração dos sintomas deve ser: HOJE, ONTEM, ESTA_SEMANA ou MAIS_DE_UMA_SEMANA.' })
  @IsNotEmpty({ message: 'A duração dos sintomas é obrigatória.' })
  duration: SymptomDuration;

  @IsInt({ message: 'A intensidade deve ser um número inteiro.' })
  @Min(1, { message: 'A intensidade deve ser no mínimo 1.' })
  @Max(10, { message: 'A intensidade deve ser no máximo 10.' })
  intensity: number;
}
