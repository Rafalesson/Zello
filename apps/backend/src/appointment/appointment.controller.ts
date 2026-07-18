import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param, Query, BadRequestException, NotFoundException, ForbiddenException, Patch, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
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

  /**
   * Get a single appointment by ID (AC: C3).
   * Protected by auth. Returns 404 for non-owners to prevent ID leaking (AC: B3/C5).
   * This endpoint MUST be declared AFTER all named routes (doctor, patient, availability)
   * to avoid route conflicts with NestJS path matching.
   */
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT', 'DOCTOR')
  async getAppointmentById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    return this.appointmentService.getAppointmentById(id, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async cancelAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CancelAppointmentDto) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new NotFoundException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.cancelAppointment(id, patientProfileId, dto.reason);
  }

  @Patch(':id/reschedule')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async rescheduleAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: RescheduleAppointmentDto) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new NotFoundException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.rescheduleAppointment(id, patientProfileId, dto.newDate);
  }

  @Patch(':id/waiting-room')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async enterWaitingRoom(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new NotFoundException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.enterWaitingRoom(id, patientProfileId);
  }

  @Patch(':id/no-show')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PATIENT')
  async markNoShow(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const patientProfileId = req.user.patientProfile?.id;
    if (!patientProfileId) {
      throw new NotFoundException(
        'Perfil de paciente não encontrado para este usuário.',
      );
    }
    return this.appointmentService.markNoShow(id, patientProfileId);
  }

  @Patch(':id/start')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('DOCTOR')
  async startConsultation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const doctorProfileId = req.user.doctorProfile?.id;
    if (!doctorProfileId) {
      throw new NotFoundException(
        'Perfil de médico não encontrado para este usuário.',
      );
    }
    return this.appointmentService.startConsultation(id, doctorProfileId);
  }
}

