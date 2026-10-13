import { z } from 'zod';

export const FollowUpSchema = z.object({
    applicationId: z.uuid(),
    jobId: z.uuid(),
    title: z.string(),
    companyName: z.string(),
    lastActivityAt: z.iso.datetime(),
});
export type FollowUp = z.infer<typeof FollowUpSchema>;

export const FollowUpListSchema = z.object({
    items: z.array(FollowUpSchema),
});
export type FollowUpList = z.infer<typeof FollowUpListSchema>;
