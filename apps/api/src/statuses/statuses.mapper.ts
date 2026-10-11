import type { Status, StatusList } from '@matchbox/shared';

import type { StatusRecord } from './types/statuses.types';

export function toStatus(status: StatusRecord): Status {
    return {
        id: status.id,
        key: status.key,
        name: status.name,
        color: status.color,
        position: status.position,
        category: status.category,
    };
}

export function toStatusList(statuses: StatusRecord[]): StatusList {
    return { items: statuses.map(toStatus) };
}
