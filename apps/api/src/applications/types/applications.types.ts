import type { WorkMode } from '@matchbox/shared';

import type { StatusRecord } from '../../statuses/types/statuses.types';

export type ApplicationJobRecord = {
    id: string;
    title: string;
    companyName: string;
    location: string | null;
    workMode: WorkMode | null;
    url: string | null;
};

export type ApplicationRecord = {
    id: string;
    job: ApplicationJobRecord;
    status: StatusRecord;
    recruiterName: string | null;
    recruiterContact: string | null;
    notes: string | null;
    appliedAt: Date | null;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type ApplicationStatusChange = {
    fromStatusId: string;
    statusId: string;
    appliedAt: Date | null;
    lastActivityAt: Date;
    occurredAt: Date;
};
