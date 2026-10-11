import { ApplicationSchema, CreateManualJobSchema, JobPageSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class JobPageResponseDto extends createZodDto(JobPageSchema) {}
export class CreateManualJobRequestDto extends createZodDto(CreateManualJobSchema) {}
export class CreatedApplicationResponseDto extends createZodDto(ApplicationSchema) {}
