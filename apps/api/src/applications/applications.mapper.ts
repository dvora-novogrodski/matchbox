import type { Application, ApplicationEvent, ApplicationList, JobPage } from '@matchbox/shared';
import { z } from 'zod';

import { toStatus } from '../statuses/statuses.mapper';
import type { ApplicationEventRecord, ApplicationRecord, JobPageRecord } from './types/applications.types';

const StatusChangedPayloadSchema = z.object({
    fromStatusId: z.uuid(),
    toStatusId: z.uuid(),
});

const NotePayloadSchema = z.object({
    text: z.string(),
});

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

export function toJobPage(page: JobPageRecord): JobPage {
    return {
        application: toApplication(page.application),
        description: page.description,
        events: page.events.map(toApplicationEvent),
        cvVersions: page.cvVersions.map((version) => ({
            id: version.id,
            isBase: version.isBase,
            commitSha: version.commitSha,
            createdAt: version.createdAt.toISOString(),
        })),
    };
}

function toApplicationEvent(event: ApplicationEventRecord): ApplicationEvent {
    const occurredAt = event.occurredAt.toISOString();
    if (event.type === 'status_changed') {
        const payload = StatusChangedPayloadSchema.safeParse(event.payload);
        return {
            id: event.id,
            type: 'status_changed',
            occurredAt,
            fromStatusId: payload.success ? payload.data.fromStatusId : null,
            toStatusId: payload.success ? payload.data.toStatusId : null,
        };
    }
    if (event.type === 'note') {
        const payload = NotePayloadSchema.safeParse(event.payload);
        return {
            id: event.id,
            type: 'note',
            occurredAt,
            text: payload.success ? payload.data.text : '',
        };
    }
    return { id: event.id, type: event.type, occurredAt };
}
