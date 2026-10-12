import type { CvDocument, Profile } from '@matchbox/shared';

import type { CvService } from '../cv/cv.service';
import { TailorUnavailableError } from '../integrations/ai/ai.errors';
import type { AiClient } from '../integrations/ai/ai-client.port';
import type { ProfileService } from '../profile/profile.service';
import { BlockedCvChangeError, DraftAlreadyClosedError, NothingToSaveError, TailorApplicationNotFoundError } from './tailor.errors';
import type { CvDraftStatus, JobCvVersionRow, StoredCvChange, TailorRepository } from './tailor.repository';
import { SAVING_STALE_AFTER_MS, TailorService } from './tailor.service';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const ITEM_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';
const UNKNOWN_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd199';
const CHANGE_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd126';
const DRAFT_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd128';
const PARENT_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd129';

const document: CvDocument = {
    header: {
        fullName: 'Ada Lovelace',
        headline: null,
        email: null,
        phone: null,
        location: null,
        links: [],
    },
    summary: '',
    experience: [
        {
            careerItemId: ITEM_ID,
            title: 'Engineer',
            organization: null,
            startDate: null,
            endDate: null,
            tech: [],
            bullets: ['Shipped the API'],
        },
    ],
    projects: [],
    skills: [],
    education: [],
};

const profile: Profile = {
    experience: [
        {
            id: ITEM_ID,
            title: 'Engineer',
            organization: null,
            startDate: null,
            endDate: null,
            tech: [],
            bullets: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd127', text: 'Shipped the API' }],
        },
    ],
    projects: [],
    education: [],
    skills: [],
};

function version(status: CvDraftStatus, overrides: Partial<JobCvVersionRow> = {}): JobCvVersionRow {
    return {
        id: DRAFT_ID,
        parentId: null,
        cv: document,
        gitPath: status === 'saved' ? 'cvs/2026-10-acme-engineer.json' : null,
        commitSha: null,
        isBase: false,
        templateId: 'default',
        status,
        savingStartedAt: null,
        createdAt: new Date('2026-10-11T12:00:00.000Z'),
        ...overrides,
    };
}

function storedChange(overrides: Partial<StoredCvChange> = {}): StoredCvChange {
    return {
        id: CHANGE_ID,
        path: 'experience[0].bullets[0]',
        op: 'replace',
        section: 'experience',
        before: 'Shipped the API',
        after: 'Shipped the public API',
        evidenceIds: [ITEM_ID],
        evidenceItemId: ITEM_ID,
        rationale: 'Matches the posting',
        state: 'proposed',
        blockedReason: null,
        model: 'test',
        promptVersion: 'tailor-1',
        runId: null,
        draftOpen: true,
        ...overrides,
    };
}

describe('TailorService', () => {
    const repository = {
        findApplication: jest.fn(),
        findLatestVersion: jest.fn(),
        saveProposals: jest.fn(),
        listOpenChanges: jest.fn(),
        listVersionChanges: jest.fn(),
        findChange: jest.fn(),
        decide: jest.fn(),
        claimDraft: jest.fn(),
        reclaimStaleDraft: jest.fn(),
        restoreSavingStart: jest.fn(),
        releaseDraft: jest.fn(),
        finalizeDraft: jest.fn(),
    } as jest.Mocked<TailorRepository>;
    const cvService = {
        getEditor: jest.fn(),
        commitDocument: jest.fn(),
        findCommitForPath: jest.fn(),
    } as unknown as jest.Mocked<Pick<CvService, 'getEditor' | 'commitDocument' | 'findCommitForPath'>>;
    const profileService = { getProfile: jest.fn() } as unknown as jest.Mocked<Pick<ProfileService, 'getProfile'>>;
    const aiClient = { tailor: jest.fn() } as jest.Mocked<AiClient>;
    const service = new TailorService(
        repository,
        cvService as unknown as CvService,
        profileService as unknown as ProfileService,
        aiClient,
    );

    beforeEach(() => {
        jest.resetAllMocks();
        repository.findApplication.mockResolvedValue({
            id: APPLICATION_ID,
            companyName: 'Acme',
            title: 'Engineer',
            description: 'Build APIs',
            requirements: [],
        });
        repository.findLatestVersion.mockResolvedValue(null);
        profileService.getProfile.mockResolvedValue(profile);
        cvService.getEditor.mockResolvedValue({ document } as Awaited<ReturnType<CvService['getEditor']>>);
    });

    it('should store a blocked change when the evidence is not in the profile', async () => {
        aiClient.tailor.mockResolvedValue({
            model: 'test',
            promptVersion: 'tailor-1',
            runId: null,
            changes: [
                {
                    path: 'experience[0].bullets[0]',
                    op: 'replace',
                    before: 'Shipped the API',
                    after: 'Invented a title',
                    evidenceIds: [UNKNOWN_ID],
                    rationale: 'Looks relevant',
                    state: 'proposed',
                    blockedReason: null,
                },
            ],
        });
        repository.saveProposals.mockImplementation((_userId, input) =>
            Promise.resolve([storedChange({ state: 'blocked', evidenceIds: [], evidenceItemId: null, blockedReason: input.changes[0]?.blockedReason })]),
        );

        const result = await service.tailor(USER_ID, APPLICATION_ID);

        expect(repository.saveProposals.mock.calls[0]?.[1].changes[0]).toEqual(
            expect.objectContaining({ state: 'blocked', evidenceIds: [] }),
        );
        expect(result.changes[0]?.state).toBe('blocked');
    });

    it('should not call the AI service for another users application', async () => {
        repository.findApplication.mockResolvedValue(null);

        await expect(service.tailor(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(TailorApplicationNotFoundError);
        expect(aiClient.tailor.mock.calls).toHaveLength(0);
    });

    it('should leave tailoring unavailable when the AI service fails', async () => {
        aiClient.tailor.mockRejectedValue(new TailorUnavailableError());

        await expect(service.tailor(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(TailorUnavailableError);
        expect(repository.saveProposals.mock.calls).toHaveLength(0);
    });

    it('should refuse to accept a blocked change', async () => {
        repository.findChange.mockResolvedValue(storedChange({ state: 'blocked', blockedReason: 'No evidence' }));

        await expect(service.decide(USER_ID, APPLICATION_ID, CHANGE_ID, { decision: 'accepted' })).rejects.toBeInstanceOf(
            BlockedCvChangeError,
        );
        expect(repository.decide.mock.calls).toHaveLength(0);
    });

    it('should replace proposals on the open draft', async () => {
        repository.findLatestVersion.mockResolvedValue(version('open', { parentId: PARENT_ID }));
        aiClient.tailor.mockResolvedValue({ model: 'test', promptVersion: 'tailor-1', runId: null, changes: [] });
        repository.saveProposals.mockResolvedValue([]);

        await service.tailor(USER_ID, APPLICATION_ID);

        expect(repository.saveProposals.mock.calls[0]).toEqual([
            USER_ID,
            expect.objectContaining({ openDraftId: DRAFT_ID, parentId: PARENT_ID }),
        ]);
    });

    it('should not start a second draft while a save is in progress', async () => {
        repository.findLatestVersion.mockResolvedValue(version('saving'));

        await expect(service.tailor(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(DraftAlreadyClosedError);
        expect(aiClient.tailor.mock.calls).toHaveLength(0);
        expect(repository.saveProposals.mock.calls).toHaveLength(0);
    });

    it('should claim the draft, commit, and then record the version', async () => {
        const order: string[] = [];
        repository.findLatestVersion.mockResolvedValue(version('open'));
        repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'accepted' })]);
        repository.claimDraft.mockImplementation(() => {
            order.push('claim');
            return Promise.resolve(true);
        });
        cvService.commitDocument.mockImplementation(() => {
            order.push('commit');
            return Promise.resolve(null);
        });
        repository.finalizeDraft.mockImplementation((_userId, _versionId, next, gitPath, commitSha) => {
            order.push('finalize');
            return Promise.resolve(version('saved', { cv: next, gitPath, commitSha }));
        });

        const saved = await service.save(USER_ID, APPLICATION_ID);

        expect(order).toEqual(['claim', 'commit', 'finalize']);
        expect(repository.claimDraft.mock.calls[0]?.[2]).toEqual(expect.stringMatching(/^cvs\/\d{4}-\d{2}-acme-engineer\.json$/));
        expect(repository.claimDraft.mock.calls[0]?.[3]).toBeInstanceOf(Date);
        expect(repository.finalizeDraft.mock.calls[0]?.[2].experience[0]?.bullets).toEqual(['Shipped the public API']);
        expect(saved.githubSynced).toBe(false);
        expect(saved.version.commitSha).toBeNull();
    });

    it('should let only one save commit when two saves claim the same draft', async () => {
        let status: CvDraftStatus = 'open';
        repository.findLatestVersion.mockImplementation(() => Promise.resolve(version(status)));
        repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'accepted' })]);
        repository.claimDraft.mockImplementation(() => {
            if (status !== 'open') {
                return Promise.resolve(false);
            }
            status = 'saving';
            return Promise.resolve(true);
        });
        repository.finalizeDraft.mockImplementation((_userId, _versionId, next, gitPath, commitSha) => {
            status = 'saved';
            return Promise.resolve(version('saved', { cv: next, gitPath, commitSha }));
        });
        cvService.commitDocument.mockResolvedValue('abc123');

        const results = await Promise.allSettled([service.save(USER_ID, APPLICATION_ID), service.save(USER_ID, APPLICATION_ID)]);

        const saved = results.find((result) => result.status === 'fulfilled');
        const rejected = results.find((result) => result.status === 'rejected');
        expect(saved?.status).toBe('fulfilled');
        expect(rejected?.status).toBe('rejected');
        const reason: unknown = rejected?.status === 'rejected' ? rejected.reason : undefined;
        expect(reason).toBeInstanceOf(DraftAlreadyClosedError);
        if (reason instanceof DraftAlreadyClosedError) {
            expect(reason.getStatus()).toBe(409);
        }
        expect(cvService.commitDocument.mock.calls).toHaveLength(1);
    });

    it('should reopen the draft when the GitHub commit fails', async () => {
        let status: CvDraftStatus = 'open';
        repository.findLatestVersion.mockImplementation(() => Promise.resolve(version(status)));
        repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'accepted' })]);
        repository.claimDraft.mockImplementation(() => {
            if (status !== 'open') {
                return Promise.resolve(false);
            }
            status = 'saving';
            return Promise.resolve(true);
        });
        repository.releaseDraft.mockImplementation(() => {
            if (status === 'saving') {
                status = 'open';
            }
            return Promise.resolve();
        });
        cvService.commitDocument.mockRejectedValue(new Error('GitHub is down'));

        await expect(service.save(USER_ID, APPLICATION_ID)).rejects.toThrow('GitHub is down');

        expect(repository.releaseDraft.mock.calls).toEqual([[USER_ID, DRAFT_ID]]);
        expect(repository.finalizeDraft.mock.calls).toHaveLength(0);
        expect(status).toBe('open');
    });

    it('should record a stale saving draft from the commit already in GitHub', async () => {
        const now = new Date('2026-10-12T12:00:00.000Z');
        const gitPath = 'cvs/2026-10-acme-engineer.json';
        jest.useFakeTimers({ now });
        try {
            repository.findLatestVersion.mockResolvedValue(
                version('saving', { gitPath, savingStartedAt: new Date(now.getTime() - SAVING_STALE_AFTER_MS - 1_000) }),
            );
            repository.reclaimStaleDraft.mockResolvedValue(true);
            repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'accepted' })]);
            cvService.findCommitForPath.mockResolvedValue('abc123');
            repository.finalizeDraft.mockImplementation((_userId, _versionId, next, path, commitSha) =>
                Promise.resolve(version('saved', { cv: next, gitPath: path, commitSha })),
            );

            const saved = await service.save(USER_ID, APPLICATION_ID);

            expect(cvService.findCommitForPath.mock.calls[0]).toEqual([USER_ID, gitPath]);
            expect(cvService.commitDocument.mock.calls).toHaveLength(0);
            expect(repository.finalizeDraft.mock.calls[0]?.[4]).toBe('abc123');
            expect(saved.githubSynced).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('should commit a stale saving draft when GitHub has no file at that path', async () => {
        const now = new Date('2026-10-12T12:00:00.000Z');
        const gitPath = 'cvs/2026-10-acme-engineer.json';
        jest.useFakeTimers({ now });
        try {
            repository.findLatestVersion.mockResolvedValue(
                version('saving', { gitPath, savingStartedAt: new Date(now.getTime() - SAVING_STALE_AFTER_MS - 1_000) }),
            );
            repository.reclaimStaleDraft.mockResolvedValue(true);
            repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'accepted' })]);
            cvService.findCommitForPath.mockResolvedValue(null);
            cvService.commitDocument.mockResolvedValue('def456');
            repository.finalizeDraft.mockImplementation((_userId, _versionId, next, path, commitSha) =>
                Promise.resolve(version('saved', { cv: next, gitPath: path, commitSha })),
            );

            const saved = await service.save(USER_ID, APPLICATION_ID);

            expect(repository.claimDraft.mock.calls).toHaveLength(0);
            expect(cvService.commitDocument.mock.calls).toHaveLength(1);
            expect(repository.finalizeDraft.mock.calls[0]?.[4]).toBe('def456');
            expect(saved.version.commitSha).toBe('def456');
        } finally {
            jest.useRealTimers();
        }
    });

    it('should reject a save while a fresh claim is still saving', async () => {
        const now = new Date('2026-10-12T12:00:00.000Z');
        jest.useFakeTimers({ now });
        try {
            repository.findLatestVersion.mockResolvedValue(
                version('saving', {
                    gitPath: 'cvs/2026-10-acme-engineer.json',
                    savingStartedAt: new Date(now.getTime() - 60_000),
                }),
            );

            const error: unknown = await service.save(USER_ID, APPLICATION_ID).then(
                () => null,
                (reason: unknown) => reason,
            );

            expect(error).toBeInstanceOf(DraftAlreadyClosedError);
            if (error instanceof DraftAlreadyClosedError) {
                expect(error.getStatus()).toBe(409);
            }
            expect(repository.reclaimStaleDraft.mock.calls).toHaveLength(0);
            expect(cvService.findCommitForPath.mock.calls).toHaveLength(0);
            expect(cvService.commitDocument.mock.calls).toHaveLength(0);
        } finally {
            jest.useRealTimers();
        }
    });

    it('should refuse to save when no change has been accepted', async () => {
        repository.findLatestVersion.mockResolvedValue(version('open'));
        repository.claimDraft.mockResolvedValue(true);
        repository.listVersionChanges.mockResolvedValue([storedChange({ state: 'proposed' })]);

        await expect(service.save(USER_ID, APPLICATION_ID)).rejects.toBeInstanceOf(NothingToSaveError);
        expect(repository.releaseDraft.mock.calls).toEqual([[USER_ID, DRAFT_ID]]);
        expect(cvService.commitDocument.mock.calls).toHaveLength(0);
    });
});
