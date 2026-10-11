import type { StatusCategory, SystemStatusKey } from '@matchbox/shared';

export type StatusRecord = {
    id: string;
    key: SystemStatusKey | null;
    name: string;
    color: string | null;
    position: number;
    category: StatusCategory;
};
