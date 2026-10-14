import type { DiscoverList, FollowUpList } from '@matchbox/shared';

import { TodayService } from './today.service';
import type { TodayApplicationRecord } from './types/today.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const JOB_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';
const NOW = new Date('2026-10-12T09:00:00.000Z');

function buildApplication(overrides: Partial<TodayApplicationRecord> = {}): TodayApplicationRecord {
    return {
        applicationId: APPLICATION_ID,
        jobId: JOB_ID,
        title: 'Engineer',
        companyName: 'Acme',
        jobUrl: 'https://acme.example/jobs/engineer',
        lastActivityAt: NOW,
        ...overrides,
    };
}

describe('TodayService', () => {
    const todayRepository = {
        listWithoutTailoredCv: jest.fn(),
        countInProgress: jest.fn(),
    };
    const discoverService = {
        list: jest.fn(),
    };
    const followUpsService = {
        list: jest.fn(),
    };
    const service = new TodayService(todayRepository, discoverService, followUpsService);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should assemble matches, cv work, follow-ups, and stats', async () => {
        const discover: DiscoverList = {
            items: [
                {
                    jobId: JOB_ID,
                    title: 'Engineer',
                    companyName: 'Acme',
                    location: null,
                    workMode: null,
                    url: null,
                    description: null,
                    score: 80,
                    fitLines: [],
                },
            ],
        };
        const toTailor = buildApplication();
        const followUp = buildApplication({
            applicationId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd126',
            lastActivityAt: new Date('2026-10-01T09:00:00.000Z'),
        });
        const followUps: FollowUpList = {
            items: [
                {
                    applicationId: followUp.applicationId,
                    jobId: followUp.jobId,
                    title: followUp.title,
                    companyName: followUp.companyName,
                    jobUrl: followUp.jobUrl,
                    lastActivityAt: followUp.lastActivityAt.toISOString(),
                },
            ],
        };
        discoverService.list.mockResolvedValue(discover);
        todayRepository.listWithoutTailoredCv.mockResolvedValue([toTailor]);
        followUpsService.list.mockResolvedValue(followUps);
        todayRepository.countInProgress.mockResolvedValue(2);

        const result = await service.get(USER_ID);

        expect(result.matches).toEqual([
            { jobId: JOB_ID, title: 'Engineer', companyName: 'Acme', jobUrl: null, score: 80 },
        ]);
        expect(result.toTailor).toEqual([
            {
                applicationId: APPLICATION_ID,
                jobId: JOB_ID,
                title: 'Engineer',
                companyName: 'Acme',
                jobUrl: 'https://acme.example/jobs/engineer',
                lastActivityAt: NOW.toISOString(),
            },
        ]);
        expect(result.followUps[0]?.applicationId).toBe(followUp.applicationId);
        expect(result.stats).toEqual({ matches: 1, toTailor: 1, followUps: 1, inProgress: 2 });
        expect(followUpsService.list).toHaveBeenCalledWith(USER_ID);
    });
});
