import { z } from 'zod';

export const TodayMatchSchema = z.object({
    jobId: z.uuid(),
    title: z.string(),
    companyName: z.string(),
    score: z.number().int().min(0).max(100),
});
export type TodayMatch = z.infer<typeof TodayMatchSchema>;

export const TodayApplicationSchema = z.object({
    applicationId: z.uuid(),
    jobId: z.uuid(),
    title: z.string(),
    companyName: z.string(),
    lastActivityAt: z.iso.datetime(),
});
export type TodayApplication = z.infer<typeof TodayApplicationSchema>;

export const TodayStatsSchema = z.object({
    matches: z.number().int().nonnegative(),
    toTailor: z.number().int().nonnegative(),
    followUps: z.number().int().nonnegative(),
    inProgress: z.number().int().nonnegative(),
});
export type TodayStats = z.infer<typeof TodayStatsSchema>;

export const TodaySchema = z.object({
    matches: z.array(TodayMatchSchema),
    toTailor: z.array(TodayApplicationSchema),
    followUps: z.array(TodayApplicationSchema),
    stats: TodayStatsSchema,
});
export type Today = z.infer<typeof TodaySchema>;
