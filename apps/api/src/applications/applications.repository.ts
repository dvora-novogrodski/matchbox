import type {
    ApplicationDetailsUpdate,
    ApplicationRecord,
    ApplicationStatusChange,
    JobPageRecord,
} from './types/applications.types';

export abstract class ApplicationsRepository {
    abstract list(userId: string): Promise<ApplicationRecord[]>;
    abstract findById(userId: string, applicationId: string): Promise<ApplicationRecord | null>;
    abstract findPageByJobId(userId: string, jobId: string): Promise<JobPageRecord | null>;
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
}
