import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateActivityDto) {
    await this.assertDayOwner(userId, dto.tripDayId);
    return this.prisma.activity.create({ data: dto });
  }

  async update(userId: string, id: string, dto: UpdateActivityDto) {
    await this.assertActivityOwner(userId, id);
    if (dto.tripDayId) await this.assertDayOwner(userId, dto.tripDayId);
    return this.prisma.activity.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertActivityOwner(userId, id);
    return this.prisma.activity.delete({ where: { id } });
  }

  private async assertDayOwner(userId: string, tripDayId: string) {
    const day = await this.prisma.tripDay.findUnique({
      where: { id: tripDayId },
      select: { trip: { select: { userId: true } } }
    });
    if (!day) throw new NotFoundException('Trip day not found');
    if (day.trip.userId !== userId) throw new ForbiddenException('You cannot access this activity');
  }

  private async assertActivityOwner(userId: string, id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: { tripDay: { select: { trip: { select: { userId: true } } } } }
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.tripDay.trip.userId !== userId) throw new ForbiddenException('You cannot access this activity');
  }
}
