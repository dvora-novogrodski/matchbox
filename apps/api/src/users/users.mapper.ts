import type { AuthUser } from '../auth/types/auth.types';
import type { UserResponseDto } from './dto/users.dto';

export function toUserResponse(user: AuthUser): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
