import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripsService } from '../trips/trips.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService, private tripsService: TripsService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    await this.tripsService.assertOwner(userId, dto.tripId);
    return this.prisma.expense.create({ data: { ...dto, expenseDate: new Date(dto.expenseDate) } });
  }

  async findByTrip(userId: string, tripId: string) {
    await this.tripsService.assertOwner(userId, tripId);
    return this.prisma.expense.findMany({ where: { tripId }, orderBy: { expenseDate: 'desc' } });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, select: { tripId: true } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.tripsService.assertOwner(userId, expense.tripId);
    if (dto.tripId) await this.tripsService.assertOwner(userId, dto.tripId);
    return this.prisma.expense.update({
      where: { id },
      data: { ...dto, expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined }
    });
  }

  async remove(userId: string, id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, select: { tripId: true } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.tripsService.assertOwner(userId, expense.tripId);
    return this.prisma.expense.delete({ where: { id } });
  }
}
