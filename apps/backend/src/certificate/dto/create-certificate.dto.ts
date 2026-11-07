import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateCertificateDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  patientId!: number;

  @IsString()
  @IsNotEmpty()
  purpose!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationInDays?: number;

  @IsOptional()
  @IsString()
  cidCode?: string;

  @IsOptional()
  @IsString()
  cidDescription?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @IsOptional()
  @IsString()
  legalRepresentativeCpf?: string;

  @IsOptional()
  @IsString()
  signatureStyle?: string;
}
