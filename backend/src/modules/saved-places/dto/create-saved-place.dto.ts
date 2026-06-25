import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateSavedPlaceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  trendScore: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedBudget: number;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsString()
  shortDescription: string;

  @ApiProperty()
  @IsString()
  imageHint: string;
}
