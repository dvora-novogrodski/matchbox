import { z } from 'zod';

export const MATCH_COVERAGE_VALUES = ['covered', 'partial', 'missing'] as const;
export type MatchCoverage = (typeof MATCH_COVERAGE_VALUES)[number];

export const MatchRequirementSchema = z.object({
    requirement_index: z.number().int().nonnegative(),
    coverage: z.enum(MATCH_COVERAGE_VALUES),
    evidence_ids: z.array(z.uuid()),
    reason: z.string(),
});
export type MatchRequirement = z.infer<typeof MatchRequirementSchema>;

export const JobMatchSchema = z.object({
    score: z.number().int().min(0).max(100),
    requirements: z.array(MatchRequirementSchema),
    model: z.string(),
    promptVersion: z.string(),
});
export type JobMatch = z.infer<typeof JobMatchSchema>;

export const JobMatchResponseSchema = z.object({
    match: JobMatchSchema.nullable(),
});
export type JobMatchResponse = z.infer<typeof JobMatchResponseSchema>;
