// Endereço: apps/backend/src/availability/availability.controller.ts
import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { AvailabilityService } from './availability.service';
import {
  UpdateAvailabilityDto,
  UpdateAvailabilityRangesDto,
} from './dto/update-availability.dto';

@Controller('availability')
@UseGuards(AuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * GET /availability
   * Retorna os slots de disponibilidade do médico autenticado.
   */
  @Get()
  @Roles('DOCTOR')
  async getAvailability(@Request() req) {
    const doctorProfileId = req.user.doctorProfile?.id;
    if (!doctorProfileId) {
      throw new ForbiddenException(
        'Perfil de médico não encontrado para este usuário.',
      );
    }
    return this.availabilityService.getByDoctor(doctorProfileId);
  }

  /**
   * PUT /availability
   * Substitui todos os slots de disponibilidade do médico autenticado (legado).
   */
  @Put()
  @Roles('DOCTOR')
  async updateAvailability(
    @Request() req,
    @Body() updateDto: UpdateAvailabilityDto,
  ) {
    const doctorProfileId = req.user.doctorProfile?.id;
    if (!doctorProfileId) {
      throw new ForbiddenException(
        'Perfil de médico não encontrado para este usuário.',
      );
    }
    return this.availabilityService.upsert(doctorProfileId, updateDto.slots);
  }

  /**
   * PUT /availability/ranges
   * Recebe faixas de horário (startTime/endTime por dia) e gera
   * automaticamente os slots de 60 min dentro de cada faixa.
   */
  @Put('ranges')
  @Roles('DOCTOR')
  async updateAvailabilityFromRanges(
    @Request() req,
    @Body() updateDto: UpdateAvailabilityRangesDto,
  ) {
    const doctorProfileId = req.user.doctorProfile?.id;
    if (!doctorProfileId) {
      throw new ForbiddenException(
        'Perfil de médico não encontrado para este usuário.',
      );
    }
    return this.availabilityService.upsertFromRanges(
      doctorProfileId,
      updateDto.ranges,
    );
  }
}

