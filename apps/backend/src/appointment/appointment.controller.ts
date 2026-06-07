import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

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
}
