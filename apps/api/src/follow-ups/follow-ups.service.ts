import { type FollowUpList, PLANS } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { FollowUpNotFoundError } from './follow-ups.errors';
import { toFollowUp } from './follow-ups.mapper';
import { FollowUpsRepository } from './follow-ups.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class FollowUpsService {
    constructor(private readonly followUpsRepository: FollowUpsRepository) {}

    async list(userId: string): Promise<FollowUpList> {
        const inactiveBefore = new Date(Date.now() - PLANS.owner['followUp.afterDays'] * DAY_MS);
        const due = await this.followUpsRepository.listDue(userId, inactiveBefore);
        return { items: due.map(toFollowUp) };
    }

    async record(userId: string, applicationId: string): Promise<void> {
        const recorded = await this.followUpsRepository.record(userId, applicationId, new Date());
        if (!recorded) {
            throw new FollowUpNotFoundError(applicationId);
        }
    }
}
