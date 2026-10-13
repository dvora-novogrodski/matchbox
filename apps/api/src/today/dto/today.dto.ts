import { TodaySchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class TodayResponseDto extends createZodDto(TodaySchema) {}
