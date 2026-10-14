import type { TodayApplication } from '@matchbox/shared';

import type { TodayApplicationRecord } from './types/today.types';

export function toTodayApplication(application: TodayApplicationRecord): TodayApplication {
    return {
        applicationId: application.applicationId,
        jobId: application.jobId,
        title: application.title,
        companyName: application.companyName,
        jobUrl: application.jobUrl,
        lastActivityAt: application.lastActivityAt.toISOString(),
    };
}
