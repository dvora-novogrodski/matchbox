import type { FollowUpRecord } from './types/follow-ups.types';

export abstract class FollowUpsRepository {
    abstract listDue(userId: string, inactiveBefore: Date): Promise<FollowUpRecord[]>;
    abstract record(userId: string, applicationId: string, occurredAt: Date): Promise<boolean>;
}
