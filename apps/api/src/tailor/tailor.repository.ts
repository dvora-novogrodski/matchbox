import type { CvChangeOp, CvChangeState, CvDocument } from '@matchbox/shared';

import type { CvSectionName } from './cv-change-path';

export type TailorApplication = {
    id: string;
    companyName: string;
    title: string;
    description: string | null;
    requirements: unknown;
};

export type CvDraftStatus = 'open' | 'saving' | 'saved';

export type JobCvVersionRow = {
    id: string;
    parentId: string | null;
    cv: unknown;
    gitPath: string | null;
    commitSha: string | null;
    isBase: boolean;
    templateId: string;
    status: CvDraftStatus;
    savingStartedAt: Date | null;
    createdAt: Date;
};

export type NewCvChange = {
    path: string;
    op: CvChangeOp;
    section: CvSectionName;
    before: string | null;
    after: string;
    evidenceIds: string[];
    evidenceItemId: string | null;
    rationale: string;
    state: 'proposed' | 'blocked';
    blockedReason: string | null;
    model: string;
    promptVersion: string;
    runId: string | null;
};

export type StoredCvChange = Omit<NewCvChange, 'state'> & {
    id: string;
    draftOpen: boolean;
    state: CvChangeState;
};

export type SaveProposalsInput = {
    applicationId: string;
    openDraftId: string | null;
    parentId: string | null;
    document: CvDocument;
    changes: NewCvChange[];
};

export abstract class TailorRepository {
    abstract findApplication(userId: string, applicationId: string): Promise<TailorApplication | null>;
    abstract findLatestVersion(userId: string, applicationId: string): Promise<JobCvVersionRow | null>;
    abstract saveProposals(userId: string, input: SaveProposalsInput): Promise<StoredCvChange[]>;
    abstract listOpenChanges(userId: string, applicationId: string): Promise<StoredCvChange[]>;
    abstract listVersionChanges(userId: string, versionId: string): Promise<StoredCvChange[]>;
    abstract findChange(userId: string, applicationId: string, changeId: string): Promise<StoredCvChange | null>;
    abstract decide(
        userId: string,
        changeId: string,
        state: 'accepted' | 'rejected',
        decidedAt: Date,
    ): Promise<StoredCvChange | null>;
    /** Sets status to saving only when it is still open. False means another save won. */
    abstract claimDraft(userId: string, versionId: string, gitPath: string, savingStartedAt: Date): Promise<boolean>;
    /** Takes over a saving draft whose claim is older than the cutoff. False means another save won. */
    abstract reclaimStaleDraft(
        userId: string,
        versionId: string,
        gitPath: string,
        savingStartedAt: Date,
        staleBefore: Date,
    ): Promise<boolean>;
    /** Puts the previous claim time back after a reclaim could not see GitHub. */
    abstract restoreSavingStart(userId: string, versionId: string, savingStartedAt: Date | null): Promise<void>;
    /** Returns a draft to open after a failed GitHub commit. */
    abstract releaseDraft(userId: string, versionId: string): Promise<void>;
    /** Records the saved document only while this save still holds the claim. */
    abstract finalizeDraft(
        userId: string,
        versionId: string,
        document: CvDocument,
        gitPath: string,
        commitSha: string | null,
    ): Promise<JobCvVersionRow | null>;
}
