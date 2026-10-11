import type {
    ApplicationDetailsUpdate,
    ApplicationRecord,
    ApplicationStatusChange,
    CreateManualJobResult,
    JobPageRecord,
    ManualJobDraft,
    MatchLookup,
} from './types/applications.types';

export abstract class ApplicationsRepository {
    abstract list(userId: string): Promise<ApplicationRecord[]>;
    abstract findById(userId: string, applicationId: string): Promise<ApplicationRecord | null>;
    abstract findPageByJobId(userId: string, jobId: string): Promise<JobPageRecord | null>;
    abstract findMatchByJobId(userId: string, jobId: string): Promise<MatchLookup>;
    abstract changeStatus(
        userId: string,
        applicationId: string,
        change: ApplicationStatusChange,
    ): Promise<ApplicationRecord | null>;
    abstract updateDetails(
        userId: string,
        applicationId: string,
        update: ApplicationDetailsUpdate,
    ): Promise<ApplicationRecord | null>;
    abstract createManual(
        userId: string,
        draft: ManualJobDraft,
        statusId: string,
        occurredAt: Date,
    ): Promise<CreateManualJobResult>;
}
