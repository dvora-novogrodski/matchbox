import { PLANS } from '@matchbox/shared';

import { FollowUpNotFoundError } from './follow-ups.errors';
import { FollowUpsService } from './follow-ups.service';
import type { FollowUpRecord } from './types/follow-ups.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';
const NOW = new Date('2026-10-12T09:00:00.000Z');

describe('FollowUpsService', () => {
    const followUpsRepository = {
        listDue: jest.fn(),
        record: jest.fn(),
    };
    const service = new FollowUpsService(followUpsRepository);

    beforeEach(() => {
        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(NOW);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should list applications idle longer than the plan allows', async () => {
        const due: FollowUpRecord = {
            applicationId: APPLICATION_ID,
            jobId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd124',
            title: 'Engineer',
            companyName: 'Acme',
            jobUrl: 'https://acme.example/jobs/engineer',
            lastActivityAt: new Date('2026-10-01T09:00:00.000Z'),
        };
        followUpsRepository.listDue.mockResolvedValue([due]);

        const result = await service.list(USER_ID);

        expect(result.items).toEqual([
            {
                applicationId: due.applicationId,
                jobId: due.jobId,
                title: due.title,
                companyName: due.companyName,
                jobUrl: due.jobUrl,
                lastActivityAt: due.lastActivityAt.toISOString(),
            },
        ]);
        const cutoff = new Date(NOW.getTime() - PLANS.owner['followUp.afterDays'] * 24 * 60 * 60 * 1000);
        expect(followUpsRepository.listDue).toHaveBeenCalledWith(USER_ID, cutoff);
    });

    it('should record a follow-up for the users application', async () => {
        followUpsRepository.record.mockResolvedValue(true);

        await service.record(USER_ID, APPLICATION_ID);

        expect(followUpsRepository.record).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, NOW);
    });

    it('should fail when the application is missing', async () => {
        followUpsRepository.record.mockResolvedValue(false);

        await expect(service.record(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(FollowUpNotFoundError);
    });
});
