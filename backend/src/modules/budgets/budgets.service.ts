import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripsService } from '../trips/trips.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService, private tripsService: TripsService) {}

  async findByTrip(userId: string, tripId: string) {
    await this.tripsService.assertOwner(userId, tripId);
    return this.prisma.budget.findUnique({ where: { tripId } });
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.tripsService.assertOwner(userId, budget.tripId);
    const merged = {
      accommodation: Number(dto.accommodation ?? budget.accommodation),
      food: Number(dto.food ?? budget.food),
      transportation: Number(dto.transportation ?? budget.transportation),
      activities: Number(dto.activities ?? budget.activities),
      shopping: Number(dto.shopping ?? budget.shopping),
      emergency: Number(dto.emergency ?? budget.emergency)
    };
    const totalEstimatedCost = Object.values(merged).reduce((sum, value) => sum + value, 0);
    return this.prisma.budget.update({ where: { id }, data: { ...dto, totalEstimatedCost } });
  }
}
