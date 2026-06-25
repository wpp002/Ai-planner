import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { AiPlannerController } from './ai-planner.controller';
import { AiPlannerService } from './ai-planner.service';

@Module({
  imports: [TripsModule],
  controllers: [AiPlannerController],
  providers: [AiPlannerService]
})
export class AiPlannerModule {}
