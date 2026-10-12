import { CvChangeSchema, DecideCvChangeSchema, SavedJobCvSchema, TailorResultSchema } from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class TailorResultResponseDto extends createZodDto(TailorResultSchema) {}
export class CvChangeResponseDto extends createZodDto(CvChangeSchema) {}
export class DecideCvChangeRequestDto extends createZodDto(DecideCvChangeSchema) {}
export class SavedJobCvResponseDto extends createZodDto(SavedJobCvSchema) {}
