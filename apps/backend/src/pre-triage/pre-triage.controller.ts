import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { PreTriageService } from './pre-triage.service';
import { CreatePreTriageDto } from './dto/create-pre-triage.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AppointmentService } from '../appointment/appointment.service';

@Controller('appointments')
export class PreTriageController {
  constructor(
    private readonly preTriageService: PreTriageService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Post(':id/pre-triage')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  async createPreTriage(
    @Req() req: any,
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() dto: CreatePreTriageDto,
  ) {
    return this.preTriageService.createOrUpdate(req.user.id, appointmentId, dto);
  }

  @Get(':id/pre-triage')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT', 'DOCTOR')
  async getPreTriage(
    @Req() req: any,
    @Param('id', ParseIntPipe) appointmentId: number,
  ) {
    await this.appointmentService.getAppointmentById(appointmentId, req.user.id);
    return this.preTriageService.findByAppointmentId(appointmentId);
  }
}
