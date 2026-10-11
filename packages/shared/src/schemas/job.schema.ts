import { z } from 'zod';

import { WORK_MODES } from '../constants/domain';
import { ApplicationSchema } from './pipeline.schema';

export const REQUIREMENT_KINDS = ['must', 'nice'] as const;
export const REQUIREMENT_CATEGORIES = ['skill', 'experience', 'education', 'domain', 'location', 'other'] as const;

export const JobRequirementSchema = z.object({
    text: z.string(),
    kind: z.enum(REQUIREMENT_KINDS),
    category: z.enum(REQUIREMENT_CATEGORIES),
    hard: z.boolean(),
});
export type JobRequirement = z.infer<typeof JobRequirementSchema>;

const eventFields = {
    id: z.uuid(),
    occurredAt: z.iso.datetime(),
};

export const StatusChangedEventSchema = z.object({
    ...eventFields,
    type: z.literal('status_changed'),
    fromStatusId: z.uuid().nullable(),
    toStatusId: z.uuid().nullable(),
});

export const NoteEventSchema = z.object({
    ...eventFields,
    type: z.literal('note'),
    text: z.string(),
});

export const CreatedEventSchema = z.object({
    ...eventFields,
    type: z.literal('created'),
});

export const EmailEventSchema = z.object({
    ...eventFields,
    type: z.literal('email'),
});

export const FollowUpEventSchema = z.object({
    ...eventFields,
    type: z.literal('follow_up'),
});

export const ApplicationEventSchema = z.discriminatedUnion('type', [
    StatusChangedEventSchema,
    NoteEventSchema,
    CreatedEventSchema,
    EmailEventSchema,
    FollowUpEventSchema,
]);
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;

export const ApplicationCvVersionSummarySchema = z.object({
    id: z.uuid(),
    isBase: z.boolean(),
    commitSha: z.string().nullable(),
    createdAt: z.iso.datetime(),
});
export type ApplicationCvVersionSummary = z.infer<typeof ApplicationCvVersionSummarySchema>;

export const JobPageSchema = z.object({
    application: ApplicationSchema,
    description: z.string().nullable(),
    requirements: z.array(JobRequirementSchema),
    events: z.array(ApplicationEventSchema),
    cvVersions: z.array(ApplicationCvVersionSummarySchema),
});
export type JobPage = z.infer<typeof JobPageSchema>;

export const RECRUITER_FIELD_MAX_LENGTH = 200;
export const APPLICATION_NOTES_MAX_LENGTH = 10000;

export const MANUAL_JOB_COMPANY_MAX_LENGTH = 200;
export const MANUAL_JOB_TITLE_MAX_LENGTH = 200;
export const MANUAL_JOB_URL_MAX_LENGTH = 2000;
export const MANUAL_JOB_LOCATION_MAX_LENGTH = 200;
export const MANUAL_JOB_DESCRIPTION_MAX_LENGTH = 20000;

export const CreateManualJobSchema = z.object({
    companyName: z.string().trim().min(1).max(MANUAL_JOB_COMPANY_MAX_LENGTH),
    title: z.string().trim().min(1).max(MANUAL_JOB_TITLE_MAX_LENGTH),
    url: z
        .string()
        .trim()
        .max(MANUAL_JOB_URL_MAX_LENGTH)
        .refine((value) => value.length === 0 || isHttpUrl(value)),
    location: z.string().trim().max(MANUAL_JOB_LOCATION_MAX_LENGTH),
    workMode: z.union([z.enum(WORK_MODES), z.literal('')]),
    description: z.string().trim().max(MANUAL_JOB_DESCRIPTION_MAX_LENGTH),
});
export type CreateManualJob = z.infer<typeof CreateManualJobSchema>;

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export const UpdateApplicationSchema = z.object({
    recruiterName: z.string().max(RECRUITER_FIELD_MAX_LENGTH),
    recruiterContact: z.string().max(RECRUITER_FIELD_MAX_LENGTH),
    notes: z.string().max(APPLICATION_NOTES_MAX_LENGTH),
});
export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;
