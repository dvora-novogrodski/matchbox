import {
    ApplicationListSchema,
    ApplicationSchema,
    ChangeApplicationStatusSchema,
    UpdateApplicationSchema,
} from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class ApplicationListResponseDto extends createZodDto(ApplicationListSchema) {}
export class ApplicationResponseDto extends createZodDto(ApplicationSchema) {}
export class ChangeApplicationStatusRequestDto extends createZodDto(ChangeApplicationStatusSchema) {}
export class UpdateApplicationRequestDto extends createZodDto(UpdateApplicationSchema) {}
