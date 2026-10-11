import { JobPageSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class JobPageResponseDto extends createZodDto(JobPageSchema) {}
