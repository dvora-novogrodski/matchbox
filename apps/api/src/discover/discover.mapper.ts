import type { Application } from '@matchbox/shared';

import { toStatus } from '../statuses/statuses.mapper';
import type { SavedApplicationRecord } from './types/discover.types';

export function toSavedApplication(application: SavedApplicationRecord): Application {
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
