import { StatusListSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class StatusListResponseDto extends createZodDto(StatusListSchema) {}
