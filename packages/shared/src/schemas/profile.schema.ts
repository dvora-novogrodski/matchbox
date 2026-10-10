import { z } from 'zod';

import { PROFILE_LIMITS } from '../constants/profile-limits';

const { maxBulletTextLength, maxBulletsPerItem, maxItemTitleLength, maxOrganizationLength, maxSkillNameLength, maxSkills, maxTechTagLength, maxTechTags } =
    PROFILE_LIMITS;

export const CalendarDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .superRefine((value, context) => {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day
        ) {
            context.addIssue({ code: 'custom', message: 'Invalid calendar date' });
        }
    });

const NullableCalendarDateSchema = CalendarDateSchema.nullable();

export const ProfileBulletSchema = z.object({
    id: z.uuid(),
    text: z.string().trim().min(1).max(maxBulletTextLength),
});

export const ProfileBulletInputSchema = z.object({
    id: z.uuid().optional(),
    text: z.string().trim().min(1).max(maxBulletTextLength),
});

const bulletsInputArray = z.array(ProfileBulletInputSchema).max(maxBulletsPerItem);
const bulletsReadArray = z.array(ProfileBulletSchema).max(maxBulletsPerItem);

const optionalNullableOrg = z.string().trim().min(1).max(maxOrganizationLength).nullable().optional();
const techArray = z.array(z.string().trim().min(1).max(maxTechTagLength)).max(maxTechTags).optional();

export const ProfileExperienceSchema = z.object({
    id: z.uuid(),
    title: z.string().trim().min(1).max(maxItemTitleLength),
    organization: z.string().trim().min(1).max(maxOrganizationLength).nullable(),
    startDate: NullableCalendarDateSchema,
    endDate: NullableCalendarDateSchema,
    tech: z.array(z.string().trim().min(1).max(maxTechTagLength)).max(maxTechTags),
    bullets: bulletsReadArray,
});

export const CreateExperienceSchema = z.object({
    title: z.string().trim().min(1).max(maxItemTitleLength),
    organization: z.string().trim().min(1).max(maxOrganizationLength).nullable().optional(),
    startDate: NullableCalendarDateSchema.optional(),
    endDate: NullableCalendarDateSchema.optional(),
    tech: techArray,
    bullets: bulletsInputArray.optional(),
});

export const UpdateExperienceSchema = z
    .object({
        title: z.string().trim().min(1).max(maxItemTitleLength).optional(),
        organization: optionalNullableOrg,
        startDate: NullableCalendarDateSchema.optional(),
        endDate: NullableCalendarDateSchema.optional(),
        tech: techArray,
        bullets: bulletsInputArray.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const ProfileProjectSchema = z.object({
    id: z.uuid(),
    title: z.string().trim().min(1).max(maxItemTitleLength),
    organization: z.string().trim().min(1).max(maxOrganizationLength).nullable(),
    startDate: NullableCalendarDateSchema,
    endDate: NullableCalendarDateSchema,
    tech: z.array(z.string().trim().min(1).max(maxTechTagLength)).max(maxTechTags),
    bullets: bulletsReadArray,
});

export const CreateProjectSchema = CreateExperienceSchema;
export const UpdateProjectSchema = UpdateExperienceSchema;

export const ProfileEducationSchema = z.object({
    id: z.uuid(),
    degree: z.string().trim().min(1).max(maxItemTitleLength),
    institution: z.string().trim().min(1).max(maxOrganizationLength).nullable(),
    startDate: NullableCalendarDateSchema,
    endDate: NullableCalendarDateSchema,
    bullets: bulletsReadArray,
});

export const CreateEducationSchema = z.object({
    degree: z.string().trim().min(1).max(maxItemTitleLength),
    institution: z.string().trim().min(1).max(maxOrganizationLength).nullable().optional(),
    startDate: NullableCalendarDateSchema.optional(),
    endDate: NullableCalendarDateSchema.optional(),
    bullets: bulletsInputArray.optional(),
});

export const UpdateEducationSchema = z
    .object({
        degree: z.string().trim().min(1).max(maxItemTitleLength).optional(),
        institution: optionalNullableOrg,
        startDate: NullableCalendarDateSchema.optional(),
        endDate: NullableCalendarDateSchema.optional(),
        bullets: bulletsInputArray.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const ProfileSkillSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(maxSkillNameLength),
});

export const ProfileSchema = z.object({
    experience: z.array(ProfileExperienceSchema),
    projects: z.array(ProfileProjectSchema),
    education: z.array(ProfileEducationSchema),
    skills: z.array(ProfileSkillSchema).max(maxSkills),
});

export const ReplaceProfileSkillsSchema = z.object({
    skills: z.array(z.string().trim().min(1).max(maxSkillNameLength)).max(maxSkills),
});

export const ReplaceProfileSkillsResponseSchema = z.object({
    skills: z.array(ProfileSkillSchema).max(maxSkills),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileExperience = z.infer<typeof ProfileExperienceSchema>;
export type ProfileProject = z.infer<typeof ProfileProjectSchema>;
export type ProfileEducation = z.infer<typeof ProfileEducationSchema>;
export type ProfileSkill = z.infer<typeof ProfileSkillSchema>;
export type ProfileBullet = z.infer<typeof ProfileBulletSchema>;
export type ProfileBulletInput = z.infer<typeof ProfileBulletInputSchema>;
export type CreateExperience = z.infer<typeof CreateExperienceSchema>;
export type UpdateExperience = z.infer<typeof UpdateExperienceSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type CreateEducation = z.infer<typeof CreateEducationSchema>;
export type UpdateEducation = z.infer<typeof UpdateEducationSchema>;
export type ReplaceProfileSkillsResponse = z.infer<typeof ReplaceProfileSkillsResponseSchema>;
