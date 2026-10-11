import type { Application, ApplicationList } from '@matchbox/shared';

import { toStatus } from '../statuses/statuses.mapper';
import type { ApplicationRecord } from './types/applications.types';

export function toApplication(application: ApplicationRecord): Application {
    return {
        id: application.id,
        job: application.job,
        status: toStatus(application.status),
        recruiterName: application.recruiterName,
        recruiterContact: application.recruiterContact,
        notes: application.notes,
        appliedAt: application.appliedAt?.toISOString() ?? null,
        lastActivityAt: application.lastActivityAt.toISOString(),
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
    };
}

export function toApplicationList(applications: ApplicationRecord[]): ApplicationList {
    return { items: applications.map(toApplication) };
}
