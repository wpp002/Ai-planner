import { Injectable } from '@nestjs/common';
import { TripsService } from '../trips/trips.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDayDto } from './dto/create-trip-day.dto';

@Injectable()
export class TripDaysService {
  constructor(private prisma: PrismaService, private tripsService: TripsService) {}

  async create(userId: string, dto: CreateTripDayDto) {
    await this.tripsService.assertOwner(userId, dto.tripId);
    return this.prisma.tripDay.create({ data: { ...dto, date: new Date(dto.date) } });
  }
}
