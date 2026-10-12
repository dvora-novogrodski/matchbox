import type { DiscoverItem, WorkMode } from '@matchbox/shared';

import type { StatusRecord } from '../../statuses/types/statuses.types';

export type DiscoverPosting = DiscoverItem;

export type SavedApplicationRecord = {
    id: string;
    job: {
        id: string;
        title: string;
        companyName: string;
        location: string | null;
        workMode: WorkMode | null;
        url: string | null;
    };
    status: StatusRecord;
    recruiterName: string | null;
    recruiterContact: string | null;
    notes: string | null;
    appliedAt: Date | null;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type SaveDiscoveredJobResult =
    | { kind: 'missing' }
    | { kind: 'skipped' }
    | { kind: 'incomplete' }
    | { kind: 'saved'; application: SavedApplicationRecord };

export type SkipDiscoveredJobResult = { kind: 'missing' } | { kind: 'saved' } | { kind: 'skipped' };
