import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class OptimizeBudgetDto {
  @ApiProperty()
  @IsString()
  tripId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalBudget: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalEstimatedCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  budgetBreakdown?: Record<string, number>;
}
