import type { ApplicationRecord, ApplicationStatusChange } from './types/applications.types';

export abstract class ApplicationsRepository {
    abstract list(userId: string): Promise<ApplicationRecord[]>;
    abstract findById(userId: string, applicationId: string): Promise<ApplicationRecord | null>;
    abstract changeStatus(
        userId: string,
        applicationId: string,
        change: ApplicationStatusChange,
    ): Promise<ApplicationRecord | null>;
}
