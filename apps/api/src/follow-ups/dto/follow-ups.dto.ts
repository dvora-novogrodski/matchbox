import { FollowUpListSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class FollowUpListResponseDto extends createZodDto(FollowUpListSchema) {}
