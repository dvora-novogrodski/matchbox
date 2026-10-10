import {
    CreateEducationSchema,
    CreateExperienceSchema,
    CreateProjectSchema,
    ProfileEducationSchema,
    ProfileExperienceSchema,
    ProfileProjectSchema,
    ProfileSchema,
    ReplaceProfileSkillsResponseSchema,
    ReplaceProfileSkillsSchema,
    UpdateEducationSchema,
    UpdateExperienceSchema,
    UpdateProjectSchema,
} from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class ProfileResponseDto extends createZodDto(ProfileSchema) {}
export class ProfileExperienceResponseDto extends createZodDto(ProfileExperienceSchema) {}
export class ProfileProjectResponseDto extends createZodDto(ProfileProjectSchema) {}
export class ProfileEducationResponseDto extends createZodDto(ProfileEducationSchema) {}
export class CreateExperienceRequestDto extends createZodDto(CreateExperienceSchema) {}
export class UpdateExperienceRequestDto extends createZodDto(UpdateExperienceSchema) {}
export class CreateProjectRequestDto extends createZodDto(CreateProjectSchema) {}
export class UpdateProjectRequestDto extends createZodDto(UpdateProjectSchema) {}
export class CreateEducationRequestDto extends createZodDto(CreateEducationSchema) {}
export class UpdateEducationRequestDto extends createZodDto(UpdateEducationSchema) {}
export class ReplaceProfileSkillsRequestDto extends createZodDto(ReplaceProfileSkillsSchema) {}
export class ReplaceProfileSkillsResponseDto extends createZodDto(ReplaceProfileSkillsResponseSchema) {}
