import { IsNotEmpty, IsDateString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  newDate: string;
}
