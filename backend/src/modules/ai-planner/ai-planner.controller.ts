import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiPlannerService } from './ai-planner.service';
import { GenerateTripDto } from './dto/generate-trip.dto';
import { DiscoverPlacesDto } from './dto/discover-places.dto';
import { RecommendHotelsDto } from './dto/recommend-hotels.dto';
import { OptimizeBudgetDto } from './dto/optimize-budget.dto';

@ApiTags('ai-planner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-planner')
export class AiPlannerController {
  constructor(private aiPlannerService: AiPlannerService) {}

  @Post('generate-trip')
  generateTrip(@CurrentUser() user: AuthUser, @Body() dto: GenerateTripDto) {
    return this.aiPlannerService.generateTrip(user.id, dto);
  }

  @Post('optimize-budget')
  optimizeBudget(@CurrentUser() user: AuthUser, @Body() dto: OptimizeBudgetDto) {
    return this.aiPlannerService.optimizeBudget(user.id, dto);
  }

  @Post('discover')
  discover(@Body() dto: DiscoverPlacesDto) {
    return this.aiPlannerService.discover(dto);
  }

  @Post('hotels')
  hotels(@Body() dto: RecommendHotelsDto) {
    return this.aiPlannerService.recommendHotels(dto);
  }
}
