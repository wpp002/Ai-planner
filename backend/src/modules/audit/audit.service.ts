import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(data: { userId?: string; action: string; entity: string; entityId?: string; metadata?: Record<string, unknown> }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }

  logAi(data: { userId?: string; provider: string; action: string; status: string; model?: string; error?: string }) {
    return this.prisma.aiUsageLog.create({ data });
  }
}
