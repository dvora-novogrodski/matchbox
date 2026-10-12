import { z } from 'zod';

import { CV_CHANGE_STATES } from '../constants/domain';
import { ApplicationCvVersionSummarySchema } from './job.schema';

export const CV_CHANGE_OPS = ['replace', 'insert', 'reorder'] as const;
export type CvChangeOp = (typeof CV_CHANGE_OPS)[number];

export const CV_CHANGE_DECISIONS = ['accepted', 'rejected'] as const;
export type CvChangeDecision = (typeof CV_CHANGE_DECISIONS)[number];

export const CvChangeEvidenceSchema = z.object({
    id: z.uuid(),
    label: z.string(),
});
export type CvChangeEvidence = z.infer<typeof CvChangeEvidenceSchema>;

/** One proposed edit. Field names follow the A4 contract. */
export const CvChangeSchema = z.object({
    id: z.uuid(),
    path: z.string(),
    op: z.enum(CV_CHANGE_OPS),
    before: z.string().nullable(),
    after: z.string(),
    evidence_ids: z.array(z.uuid()),
    evidence: z.array(CvChangeEvidenceSchema),
    rationale: z.string(),
    state: z.enum(CV_CHANGE_STATES),
    blocked_reason: z.string().nullable(),
});
export type CvChange = z.infer<typeof CvChangeSchema>;

export const TailorResultSchema = z.object({
    changes: z.array(CvChangeSchema),
});
export type TailorResult = z.infer<typeof TailorResultSchema>;

export const DecideCvChangeSchema = z.object({
    decision: z.enum(CV_CHANGE_DECISIONS),
});
export type DecideCvChange = z.infer<typeof DecideCvChangeSchema>;

export const SavedJobCvSchema = z.object({
    version: ApplicationCvVersionSummarySchema,
    githubSynced: z.boolean(),
});
export type SavedJobCv = z.infer<typeof SavedJobCvSchema>;
