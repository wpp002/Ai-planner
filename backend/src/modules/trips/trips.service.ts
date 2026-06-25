import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: { ...dto, userId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
      include: this.tripInclude()
    });
  }

  findAll(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { budget: true, expenses: true, days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } } }
    });
  }

  async findOne(userId: string, id: string) {
    await this.assertOwner(userId, id);
    return this.prisma.trip.findUniqueOrThrow({ where: { id }, include: this.tripInclude() });
  }

  async update(userId: string, id: string, dto: UpdateTripDto) {
    await this.assertOwner(userId, id);
    return this.prisma.trip.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined
      },
      include: this.tripInclude()
    });
  }

  async remove(userId: string, userRole: string, id: string) {
    if (userRole === 'SUPPORT') {
      throw new ForbiddenException('Support users cannot delete trips');
    }
    await this.assertOwner(userId, id);
    return this.prisma.trip.delete({ where: { id } });
  }

  async assertOwner(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { userId: true } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) throw new ForbiddenException('You cannot access this trip');
  }

  tripInclude() {
    return {
      budget: true,
      expenses: { orderBy: { expenseDate: 'desc' as const } },
      days: { orderBy: { dayNumber: 'asc' as const }, include: { activities: { orderBy: { time: 'asc' as const } } } }
    };
  }
}
