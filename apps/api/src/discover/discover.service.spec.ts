import { InternalServerErrorException } from '@nestjs/common';

import type { StatusesRepository } from '../statuses/statuses.repository';
import type { StatusRecord } from '../statuses/types/statuses.types';
import {
    DiscoverJobAlreadySavedError,
    DiscoverJobNotFoundError,
    DiscoverJobSkippedError,
    DiscoverPostingIncompleteError,
} from './discover.errors';
import { DiscoverService } from './discover.service';
import type { DiscoverPosting, SavedApplicationRecord } from './types/discover.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const JOB_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';
const STATUS_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd126';
const NOW = new Date('2026-10-12T09:00:00.000Z');

function buildStatus(): StatusRecord {
    return {
        id: STATUS_ID,
        key: 'saved',
        name: 'Saved',
        color: null,
        position: 0,
        category: 'open',
    };
}

function buildApplication(): SavedApplicationRecord {
    return {
        id: APPLICATION_ID,
        job: {
            id: JOB_ID,
            title: 'Engineer',
            companyName: 'Acme',
            location: 'Tel Aviv',
            workMode: 'hybrid',
            url: 'https://example.com/jobs/1',
        },
        status: buildStatus(),
        recruiterName: null,
        recruiterContact: null,
        notes: null,
        appliedAt: null,
        lastActivityAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
    };
}

function buildPosting(overrides: Partial<DiscoverPosting> = {}): DiscoverPosting {
    return {
        jobId: JOB_ID,
        title: 'Engineer',
        companyName: 'Acme',
        location: 'Tel Aviv',
        workMode: 'hybrid',
        url: 'https://example.com/jobs/1',
        description: 'Build things',
        score: 82,
        fitLines: [],
        ...overrides,
    };
}

describe('DiscoverService', () => {
    const discoverRepository = {
        listPending: jest.fn(),
        save: jest.fn(),
        skip: jest.fn(),
    };
    const statusesRepository = {
        findSystemByKey: jest.fn(),
    };
    const service = new DiscoverService(discoverRepository, statusesRepository as unknown as StatusesRepository);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('list', () => {
        it('should return pending matches for the user', async () => {
            const posting = buildPosting();
            discoverRepository.listPending.mockResolvedValue([posting]);

            const result = await service.list(USER_ID);

            expect(result).toEqual({ items: [posting] });
            expect(discoverRepository.listPending).toHaveBeenCalledWith(USER_ID);
        });
    });

    describe('save', () => {
        it('should create an application when the match is pending', async () => {
            statusesRepository.findSystemByKey.mockResolvedValue(buildStatus());
            discoverRepository.save.mockResolvedValue({
                kind: 'saved',
                application: buildApplication(),
            });

            const result = await service.save(USER_ID, JOB_ID);

            expect(result.id).toBe(APPLICATION_ID);
            expect(result.job).toEqual({
                id: JOB_ID,
                title: 'Engineer',
                companyName: 'Acme',
                location: 'Tel Aviv',
                workMode: 'hybrid',
                url: 'https://example.com/jobs/1',
            });
            expect(result.status.key).toBe('saved');
            expect(discoverRepository.save).toHaveBeenCalledWith(USER_ID, JOB_ID, STATUS_ID, expect.any(Date));
        });

        it('should fail when the saved status is not configured', async () => {
            statusesRepository.findSystemByKey.mockResolvedValue(null);

            await expect(service.save(USER_ID, JOB_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(discoverRepository.save).not.toHaveBeenCalled();
        });

        it('should fail when the job is not in the review queue', async () => {
            statusesRepository.findSystemByKey.mockResolvedValue(buildStatus());
            discoverRepository.save.mockResolvedValue({ kind: 'missing' });

            await expect(service.save(USER_ID, JOB_ID)).rejects.toBeInstanceOf(DiscoverJobNotFoundError);
        });

        it('should fail when the job was already skipped', async () => {
            statusesRepository.findSystemByKey.mockResolvedValue(buildStatus());
            discoverRepository.save.mockResolvedValue({ kind: 'skipped' });

            await expect(service.save(USER_ID, JOB_ID)).rejects.toBeInstanceOf(DiscoverJobSkippedError);
        });

        it('should fail when the posting has no title or company', async () => {
            statusesRepository.findSystemByKey.mockResolvedValue(buildStatus());
            discoverRepository.save.mockResolvedValue({ kind: 'incomplete' });

            await expect(service.save(USER_ID, JOB_ID)).rejects.toBeInstanceOf(DiscoverPostingIncompleteError);
        });
    });

    describe('skip', () => {
        it('should record a skip when the match is pending', async () => {
            discoverRepository.skip.mockResolvedValue({ kind: 'skipped' });

            await service.skip(USER_ID, JOB_ID);

            expect(discoverRepository.skip).toHaveBeenCalledWith(USER_ID, JOB_ID, expect.any(Date));
        });

        it('should fail when the job is not in the review queue', async () => {
            discoverRepository.skip.mockResolvedValue({ kind: 'missing' });

            await expect(service.skip(USER_ID, JOB_ID)).rejects.toBeInstanceOf(DiscoverJobNotFoundError);
        });

        it('should fail when the job is already in the pipeline', async () => {
            discoverRepository.skip.mockResolvedValue({ kind: 'saved' });

            await expect(service.skip(USER_ID, JOB_ID)).rejects.toBeInstanceOf(DiscoverJobAlreadySavedError);
        });
    });
});
