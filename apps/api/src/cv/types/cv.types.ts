import type { BaseCv, CvDocument } from '@matchbox/shared';

export type UserCvRecord = {
    displayName: string | null;
    email: string;
    baseCv: unknown;
    githubRepo: string | null;
    githubTokenEncrypted: string | null;
};

export type NewBaseVersion = {
    document: CvDocument;
    selection: BaseCv;
    templateId: string;
    gitPath: string;
    commitSha: string | null;
};

export type StoredCvVersion = {
    id: string;
    isBase: boolean;
    templateId: string;
    gitPath: string | null;
    commitSha: string | null;
    createdAt: Date;
};
