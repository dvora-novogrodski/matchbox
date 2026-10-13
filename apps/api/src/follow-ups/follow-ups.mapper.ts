import type { FollowUp } from '@matchbox/shared';

import type { FollowUpRecord } from './types/follow-ups.types';

export function toFollowUp(application: FollowUpRecord): FollowUp {
    return {
        applicationId: application.applicationId,
        jobId: application.jobId,
        title: application.title,
        companyName: application.companyName,
        lastActivityAt: application.lastActivityAt.toISOString(),
    };
}
