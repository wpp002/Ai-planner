import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (user?.role === 'ADMIN' || user?.role === 'SUPPORT') return true;
    throw new ForbiddenException('Admin or support access required');
  }
}
