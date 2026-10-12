import type { CvChangeOp, CvDocument, JobRequirement } from '@matchbox/shared';

export type TailorEvidence = {
    id: string;
    label: string;
    text: string;
};

export type TailorProposal = {
    path: string;
    op: CvChangeOp;
    before: string | null;
    after: string;
    evidenceIds: string[];
    rationale: string;
    state: 'proposed' | 'blocked';
    blockedReason: string | null;
};

export type TailorInput = {
    job: {
        title: string;
        companyName: string;
        description: string | null;
        requirements: JobRequirement[];
    };
    cv: CvDocument;
    evidence: TailorEvidence[];
};

export type TailorOutput = {
    model: string;
    promptVersion: string;
    runId: string | null;
    changes: TailorProposal[];
};

export abstract class AiClient {
    abstract tailor(input: TailorInput): Promise<TailorOutput>;
}
