import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuthUser } from '../../common/types/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  users() {
    return this.adminService.users();
  }

  @Get('trips')
  trips() {
    return this.adminService.trips();
  }

  @Get('audit-logs')
  auditLogs() {
    return this.adminService.auditLogs();
  }

  @Get('ai-usage')
  aiUsage() {
    return this.adminService.aiUsage();
  }

  @Get('health')
  health() {
    return this.adminService.health();
  }

  @Get('analytics')
  analytics() {
    return this.adminService.analytics();
  }

  @Get('users/:id')
  userDetail(@Param('id') id: string) {
    return this.adminService.userDetail(id);
  }

  @Get('trips/:id')
  tripDetail(@Param('id') id: string) {
    return this.adminService.tripDetail(id);
  }

  @Patch('users/:id/role')
  updateUserRole(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(user.id, user.role, id, dto);
  }

  @Delete('users/:id')
  removeUser(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.removeUser(user.id, user.role, id);
  }
}
