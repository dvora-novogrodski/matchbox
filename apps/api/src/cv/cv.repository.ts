import type { BaseCv } from '@matchbox/shared';

import type { NewBaseVersion, StoredCvVersion, UserCvRecord } from './types/cv.types';

export abstract class CvRepository {
    abstract findUserCvRecord(userId: string): Promise<UserCvRecord | null>;
    abstract saveBaseCv(userId: string, selection: BaseCv): Promise<void>;
    abstract saveGithubCredentials(userId: string, repo: string, tokenEncrypted: string): Promise<void>;
    abstract clearGithubCredentials(userId: string): Promise<void>;
    abstract createBaseVersion(userId: string, version: NewBaseVersion): Promise<StoredCvVersion>;
    abstract findLatestBaseVersion(userId: string): Promise<StoredCvVersion | null>;
}
