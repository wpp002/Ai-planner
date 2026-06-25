import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddSavedPlaceToTripDto } from './dto/add-saved-place-to-trip.dto';
import { CreateSavedPlaceDto } from './dto/create-saved-place.dto';
import { SavedPlacesService } from './saved-places.service';

@ApiTags('saved-places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-places')
export class SavedPlacesController {
  constructor(private savedPlacesService: SavedPlacesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.savedPlacesService.findAll(user.id);
  }

  @Post()
  save(@CurrentUser() user: AuthUser, @Body() dto: CreateSavedPlaceDto) {
    return this.savedPlacesService.save(user.id, dto);
  }

  @Post(':id/add-to-trip')
  addToTrip(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddSavedPlaceToTripDto) {
    return this.savedPlacesService.addToTrip(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.savedPlacesService.remove(user.id, id);
  }
}
