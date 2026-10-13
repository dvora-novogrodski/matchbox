import { ApplicationKitSchema, UpdateApplicationKitSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class ApplicationKitResponseDto extends createZodDto(ApplicationKitSchema) {}

export class UpdateApplicationKitRequestDto extends createZodDto(UpdateApplicationKitSchema) {}
