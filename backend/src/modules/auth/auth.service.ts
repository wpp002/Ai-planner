import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const adminEmail = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 12),
        role: adminEmail && adminEmail === dto.email.toLowerCase() ? 'ADMIN' : 'USER'
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    await this.audit.log({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id, metadata: { email: user.email, role: user.role } });

    return { user, accessToken: await this.sign(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.audit.log({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, metadata: { email: user.email, role: user.role } });
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: await this.sign(user.id, user.email)
    };
  }

  private sign(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d'
      }
    );
  }
}
