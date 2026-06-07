// Endereço: apps/backend/src/user/dto/create-user.dto.ts (versão com data de nascimento obrigatória para pacientes)

import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Role, Sex } from '@prisma/client';

export class CreateUserDto {
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @MinLength(6) @IsNotEmpty() password: string;
  @IsEnum(Role) role: Role;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() phone?: string;

  // --- Campos de Doutor ---
  @ValidateIf((o) => o.role === Role.DOCTOR)
  @IsNotEmpty({ message: 'CRM é obrigatório para médicos.' })
  crm?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() profilePictureUrl?: string;

  // --- Campos de Paciente ---
  @ValidateIf((o) => o.role === Role.PATIENT)
  @IsNotEmpty({ message: 'CPF é obrigatório para pacientes.' })
  cpf?: string;

  // MUDANÇA AQUI: Tornamos a data de nascimento obrigatória para pacientes
  @ValidateIf((o) => o.role === Role.PATIENT)
  @IsNotEmpty({ message: 'Data de nascimento é obrigatória para pacientes.' })
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  // --- Campos de Endereço ---
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
}
