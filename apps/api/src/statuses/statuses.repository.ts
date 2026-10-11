import type { StatusRecord } from './types/statuses.types';

export abstract class StatusesRepository {
    abstract listVisible(userId: string): Promise<StatusRecord[]>;
    abstract findVisible(userId: string, statusId: string): Promise<StatusRecord | null>;
}
