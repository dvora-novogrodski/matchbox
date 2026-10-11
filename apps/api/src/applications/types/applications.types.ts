import type { EventType, WorkMode } from '@matchbox/shared';

import type { StatusRecord } from '../../statuses/types/statuses.types';

/** User-entered details stored on the application. `id` is the shared posting. */
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

export type ApplicationEventRecord = {
    id: string;
    type: EventType;
    occurredAt: Date;
    payload: unknown;
};

export type ApplicationCvVersionRecord = {
    id: string;
    isBase: boolean;
    commitSha: string | null;
    createdAt: Date;
};

export type JobPageRecord = {
    application: ApplicationRecord;
    description: string | null;
    events: ApplicationEventRecord[];
    cvVersions: ApplicationCvVersionRecord[];
};

export type ApplicationNoteEvent = {
    text: string;
    occurredAt: Date;
};

export type ManualJobDraft = {
    companyName: string;
    title: string;
    url: string | null;
    normalizedUrl: string | null;
    location: string | null;
    workMode: WorkMode | null;
    description: string | null;
};

export type CreateManualJobResult =
    | { kind: 'created'; application: ApplicationRecord }
    | { kind: 'exists'; jobId: string };

export type ApplicationDetailsUpdate = {
    recruiterName: string | null;
    recruiterContact: string | null;
    notes: string | null;
    lastActivityAt: Date;
    note: ApplicationNoteEvent | null;
};
