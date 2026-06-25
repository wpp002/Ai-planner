import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  tripDayId: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCost: number;
}
