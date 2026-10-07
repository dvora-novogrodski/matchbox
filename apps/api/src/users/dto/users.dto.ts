import { CurrentUserSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class UserResponseDto extends createZodDto(CurrentUserSchema) {}
