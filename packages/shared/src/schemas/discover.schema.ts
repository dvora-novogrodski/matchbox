import { z } from 'zod';

import { WORK_MODES } from '../constants/domain';

export const DiscoverItemSchema = z.object({
    jobId: z.uuid(),
    title: z.string(),
    companyName: z.string(),
    location: z.string().nullable(),
    workMode: z.enum(WORK_MODES).nullable(),
    url: z.string().nullable(),
    description: z.string().nullable(),
    score: z.number().int().min(0).max(100),
});
export type DiscoverItem = z.infer<typeof DiscoverItemSchema>;

export const DiscoverListSchema = z.object({
    items: z.array(DiscoverItemSchema),
});
export type DiscoverList = z.infer<typeof DiscoverListSchema>;
