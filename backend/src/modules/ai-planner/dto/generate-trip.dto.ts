import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class GenerateTripDto {
  @ApiProperty()
  @IsString()
  destination: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numberOfDays: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numberOfPeople: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalBudget: number;

  @ApiProperty({ example: 'food,cafe,nature' })
  @IsString()
  travelStyle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
