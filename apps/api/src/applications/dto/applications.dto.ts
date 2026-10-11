import { ApplicationListSchema, ApplicationSchema, ChangeApplicationStatusSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class ApplicationListResponseDto extends createZodDto(ApplicationListSchema) {}
export class ApplicationResponseDto extends createZodDto(ApplicationSchema) {}
export class ChangeApplicationStatusRequestDto extends createZodDto(ChangeApplicationStatusSchema) {}
