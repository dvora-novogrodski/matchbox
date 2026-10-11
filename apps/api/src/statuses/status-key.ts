import { SYSTEM_STATUS_KEYS, type SystemStatusKey } from '@matchbox/shared';

export function toSystemStatusKey(key: string | null): SystemStatusKey | null {
    if (key === null) {
        return null;
    }
    return (SYSTEM_STATUS_KEYS as readonly string[]).includes(key) ? (key as SystemStatusKey) : null;
}
