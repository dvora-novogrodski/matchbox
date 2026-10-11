import { z } from 'zod';

import { ApplicationSchema } from './pipeline.schema';

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
    events: z.array(ApplicationEventSchema),
    cvVersions: z.array(ApplicationCvVersionSummarySchema),
});
export type JobPage = z.infer<typeof JobPageSchema>;

export const RECRUITER_FIELD_MAX_LENGTH = 200;
export const APPLICATION_NOTES_MAX_LENGTH = 10000;

export const UpdateApplicationSchema = z.object({
    recruiterName: z.string().max(RECRUITER_FIELD_MAX_LENGTH),
    recruiterContact: z.string().max(RECRUITER_FIELD_MAX_LENGTH),
    notes: z.string().max(APPLICATION_NOTES_MAX_LENGTH),
});
export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;
