import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiPlannerModule } from './modules/ai-planner/ai-planner.module';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SavedPlacesModule } from './modules/saved-places/saved-places.module';
import { TripDaysModule } from './modules/trip-days/trip-days.module';
import { TripsModule } from './modules/trips/trips.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    PrismaModule,
    SavedPlacesModule,
    UsersModule,
    AuthModule,
    TripsModule,
    TripDaysModule,
    ActivitiesModule,
    AdminModule,
    AuditModule,
    BudgetsModule,
    ExpensesModule,
    AiPlannerModule
  ]
})
export class AppModule {}
