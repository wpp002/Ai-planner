import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class AddSavedPlaceToTripDto {
  @ApiProperty()
  @IsString()
  tripDayId: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  time: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCost: number;
}
