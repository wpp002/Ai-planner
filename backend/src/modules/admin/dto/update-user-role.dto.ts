import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum UserRoleDto {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT'
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRoleDto })
  @IsEnum(UserRoleDto)
  role: UserRoleDto;
}
