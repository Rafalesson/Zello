import { IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @IsNotEmpty()
  doctorProfileId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
