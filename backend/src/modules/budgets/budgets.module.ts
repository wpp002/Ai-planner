import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [TripsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService]
})
export class BudgetsModule {}
