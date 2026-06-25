import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { TripDaysController } from './trip-days.controller';
import { TripDaysService } from './trip-days.service';

@Module({
  imports: [TripsModule],
  controllers: [TripDaysController],
  providers: [TripDaysService]
})
export class TripDaysModule {}
