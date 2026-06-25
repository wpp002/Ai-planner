import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [users, trips, expenses, savedPlaces, aiFallbacks] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.trip.count(),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.savedPlace.count(),
      this.prisma.aiUsageLog.count({ where: { status: 'FALLBACK' } })
    ]);
    return {
      users,
      trips,
      totalExpenses: Number(expenses._sum.amount || 0),
      savedPlaces,
      aiFallbacks
    };
  }

  auditLogs() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }

  aiUsage() {
    return this.prisma.aiUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async health() {
    const database = await this.prisma.$queryRaw`SELECT 1 as ok`;
    const latestMigration = await this.prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC
      LIMIT 1
    `;
    const recentAiErrors = await this.prisma.aiUsageLog.findMany({
      where: {
        OR: [{ status: 'ERROR' }, { error: { not: null } }]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    return {
      backend: 'online',
      database: Array.isArray(database) ? 'connected' : 'connected',
      aiProvider: process.env.GOOGLE_AI_API_KEY ? 'Gemini configured' : process.env.OPENAI_API_KEY ? 'OpenAI configured' : 'fallback only',
      latestMigration: latestMigration[0] || null,
      recentApiErrors: recentAiErrors,
      checkedAt: new Date().toISOString()
    };
  }

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { trips: true } } }
    });
  }

  trips() {
    return this.prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        budget: true,
        expenses: true
      }
    });
  }

  async analytics() {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [users, trips, expensesByCategory, topDestinations, usersByRole] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      this.prisma.trip.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } }
      }),
      this.prisma.trip.groupBy({
        by: ['destination'],
        _count: { destination: true },
        orderBy: { _count: { destination: 'desc' } },
        take: 8
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    const groupByDate = (items: Array<{ createdAt: Date }>) => {
      const map = new Map<string, number>();
      for (const item of items) {
        const key = item.createdAt.toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
    };

    return {
      usersGrowth: groupByDate(users),
      tripsCreated: groupByDate(trips),
      expensesByCategory: expensesByCategory.map((item) => ({
        category: item.category,
        amount: Number(item._sum.amount || 0)
      })),
      topDestinations: topDestinations.map((item) => ({
        destination: item.destination,
        count: item._count.destination
      })),
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.role
      }))
    };
  }

  async userDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        savedPlaces: { orderBy: { createdAt: 'desc' }, take: 20 },
        trips: {
          orderBy: { createdAt: 'desc' },
          include: { budget: true, expenses: true }
        },
        _count: { select: { trips: true, savedPlaces: true } }
      }
    });
    if (!user) throw new NotFoundException('User not found');
    const expenses = await this.prisma.expense.aggregate({
      where: { trip: { userId } },
      _sum: { amount: true }
    });
    return {
      ...user,
      totalExpenses: Number(expenses._sum.amount || 0)
    };
  }

  async tripDetail(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        budget: true,
        expenses: { orderBy: { expenseDate: 'desc' } },
        days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { time: 'asc' } } } }
      }
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async updateUserRole(adminUserId: string, adminRole: string, userId: string, dto: UpdateUserRoleDto) {
    if (adminRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change roles');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (adminUserId === userId && dto.role === 'USER') {
      throw new BadRequestException('You cannot remove your own admin role');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, name: true, email: true, role: true }
    }).then(async (updated) => {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE_USER_ROLE',
          entity: 'User',
          entityId: userId,
          metadata: { targetEmail: updated.email, role: updated.role }
        }
      });
      return updated;
    });
  }

  async removeUser(adminUserId: string, adminRole: string, userId: string) {
    if (adminRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete users');
    }
    if (adminUserId === userId) throw new BadRequestException('You cannot delete your own account');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const deleted = await this.prisma.user.delete({ where: { id: userId }, select: { id: true, email: true } });
    await this.prisma.auditLog.create({
      data: { userId: adminUserId, action: 'DELETE_USER', entity: 'User', entityId: userId, metadata: { targetEmail: deleted.email } }
    });
    return deleted;
  }
}
