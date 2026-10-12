import type { DiscoverPosting, SaveDiscoveredJobResult, SkipDiscoveredJobResult } from './types/discover.types';

export abstract class DiscoverRepository {
    abstract listPending(userId: string): Promise<DiscoverPosting[]>;
    abstract save(userId: string, jobId: string, statusId: string, occurredAt: Date): Promise<SaveDiscoveredJobResult>;
    abstract skip(userId: string, jobId: string, occurredAt: Date): Promise<SkipDiscoveredJobResult>;
}
