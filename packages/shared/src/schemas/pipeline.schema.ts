import { z } from 'zod';

import { WORK_MODES } from '../constants/domain';
import { STATUS_CATEGORIES, SYSTEM_STATUS_KEYS } from '../constants/statuses';

export const StatusSchema = z.object({
    id: z.uuid(),
    key: z.enum(SYSTEM_STATUS_KEYS).nullable(),
    name: z.string(),
    color: z.string().nullable(),
    position: z.number().int(),
    category: z.enum(STATUS_CATEGORIES),
});
export type Status = z.infer<typeof StatusSchema>;

export const StatusListSchema = z.object({
    items: z.array(StatusSchema),
});
export type StatusList = z.infer<typeof StatusListSchema>;

/** Details this user entered. Stored on the application; the shared posting only contributes the id. */
export const ApplicationJobSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    companyName: z.string(),
    location: z.string().nullable(),
    workMode: z.enum(WORK_MODES).nullable(),
    url: z.string().nullable(),
});
export type ApplicationJob = z.infer<typeof ApplicationJobSchema>;

export const ApplicationSchema = z.object({
    id: z.uuid(),
    job: ApplicationJobSchema,
    status: StatusSchema,
    recruiterName: z.string().nullable(),
    recruiterContact: z.string().nullable(),
    notes: z.string().nullable(),
    appliedAt: z.iso.datetime().nullable(),
    lastActivityAt: z.iso.datetime(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationListSchema = z.object({
    items: z.array(ApplicationSchema),
});
export type ApplicationList = z.infer<typeof ApplicationListSchema>;

export const ChangeApplicationStatusSchema = z.object({
    statusId: z.uuid(),
});
export type ChangeApplicationStatus = z.infer<typeof ChangeApplicationStatusSchema>;
