import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param, Query, BadRequestException, ForbiddenException, Patch, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('doctor')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('DOCTOR')
  async getDoctorAppointments(@Req() req: any) {
    const doctorProfileId = req.user.doctorProfile?.id;
    if (!doctorProfileId) {
      throw new ForbiddenException(
        'Perfil de médico não encontrado para este usuário.',
      );
    }
    return this.appointmentService.getDoctorAppointments(doctorProfileId);
  }

  @Get('availability/:doctorId')
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Query param "date" is required (YYYY-MM-DD)');
    }
    return this.appointmentService.getAvailableSlots(Number(doctorId), date);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() createAppointmentDto: CreateAppointmentDto) {
    const userId = req.user.id;
    return this.appointmentService.create(userId, createAppointmentDto);
  }

  @Get('patient')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async getPatientAppointments(@Req() req: any) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new ForbiddenException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.getPatientAppointments(patientProfileId);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async cancelAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('reason') reason?: string) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new ForbiddenException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.cancelAppointment(id, patientProfileId, reason);
  }

  @Patch(':id/reschedule')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async rescheduleAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('newDate') newDate: string) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new ForbiddenException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    if (!newDate || typeof newDate !== 'string') {
      throw new BadRequestException('O campo "newDate" é obrigatório e deve ser uma string válida.');
    }
    return this.appointmentService.rescheduleAppointment(id, patientProfileId, newDate);
  }
}

