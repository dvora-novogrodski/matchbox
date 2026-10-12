import { DiscoverListSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class DiscoverListResponseDto extends createZodDto(DiscoverListSchema) {}
