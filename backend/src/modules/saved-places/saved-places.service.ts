import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AddSavedPlaceToTripDto } from './dto/add-saved-place-to-trip.dto';
import { CreateSavedPlaceDto } from './dto/create-saved-place.dto';

@Injectable()
export class SavedPlacesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(userId: string) {
    return this.prisma.savedPlace.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async save(userId: string, dto: CreateSavedPlaceDto) {
    const saved = await this.prisma.savedPlace.upsert({
      where: { userId_name: { userId, name: dto.name } },
      update: dto,
      create: { ...dto, userId }
    });
    await this.audit.log({ userId, action: 'SAVE_PLACE', entity: 'SavedPlace', entityId: saved.id, metadata: { name: saved.name, category: saved.category } });
    return saved;
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const deleted = await this.prisma.savedPlace.delete({ where: { id } });
    await this.audit.log({ userId, action: 'REMOVE_SAVED_PLACE', entity: 'SavedPlace', entityId: id, metadata: { name: deleted.name } });
    return deleted;
  }

  async addToTrip(userId: string, id: string, dto: AddSavedPlaceToTripDto) {
    const place = await this.assertOwner(userId, id);
    const day = await this.prisma.tripDay.findUnique({
      where: { id: dto.tripDayId },
      select: { trip: { select: { userId: true } } }
    });
    if (!day) throw new NotFoundException('Trip day not found');
    if (day.trip.userId !== userId) throw new ForbiddenException('You cannot add this place to that trip');

    const activity = await this.prisma.activity.create({
      data: {
        tripDayId: dto.tripDayId,
        time: dto.time,
        title: place.name,
        location: place.name,
        description: place.shortDescription || place.reason,
        category: place.category,
        estimatedCost: dto.estimatedCost
      }
    });
    await this.audit.log({ userId, action: 'ADD_SAVED_PLACE_TO_TRIP', entity: 'Activity', entityId: activity.id, metadata: { savedPlaceId: id, title: activity.title } });
    return activity;
  }

  private async assertOwner(userId: string, id: string) {
    const place = await this.prisma.savedPlace.findUnique({ where: { id } });
    if (!place) throw new NotFoundException('Saved place not found');
    if (place.userId !== userId) throw new ForbiddenException('You cannot access this saved place');
    return place;
  }
}
