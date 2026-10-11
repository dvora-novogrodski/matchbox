import type { SystemStatusKey } from '@matchbox/shared';
import type { TFunction } from 'i18next';

const STATUS_LABEL_KEYS = {
    saved: 'statuses.saved',
    applied: 'statuses.applied',
    screening: 'statuses.screening',
    technical: 'statuses.technical',
    hr: 'statuses.hr',
    offer: 'statuses.offer',
    rejected: 'statuses.rejected',
    withdrawn: 'statuses.withdrawn',
} as const satisfies Record<SystemStatusKey, `statuses.${SystemStatusKey}`>;

export function statusLabel(status: { key: SystemStatusKey | null; name: string }, t: TFunction<'common'>): string {
    return status.key ? t(STATUS_LABEL_KEYS[status.key]) : status.name;
}
