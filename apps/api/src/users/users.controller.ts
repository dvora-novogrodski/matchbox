import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/users.dto';
import { toUserResponse } from './users.mapper';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  @Get('me')
  @ZodSerializerDto(UserResponseDto)
  getCurrentUser(@CurrentUser() user: AuthUser): UserResponseDto {
    return toUserResponse(user);
  }
}
