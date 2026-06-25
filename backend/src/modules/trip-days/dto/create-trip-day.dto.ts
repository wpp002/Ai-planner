import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateTripDayDto {
  @ApiProperty()
  @IsString()
  tripId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dayNumber: number;

  @ApiProperty()
  @IsDateString()
  date: string;
}
