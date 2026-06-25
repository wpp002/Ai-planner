import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTripDayDto } from './dto/create-trip-day.dto';
import { TripDaysService } from './trip-days.service';

@ApiTags('trip-days')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trip-days')
export class TripDaysController {
  constructor(private tripDaysService: TripDaysService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDayDto) {
    return this.tripDaysService.create(user.id, dto);
  }
}
