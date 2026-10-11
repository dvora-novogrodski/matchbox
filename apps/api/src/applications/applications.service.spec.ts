import { StatusNotFoundError } from '../statuses/statuses.errors';
import type { StatusesRepository } from '../statuses/statuses.repository';
import type { StatusRecord } from '../statuses/types/statuses.types';
import { ApplicationNotFoundError } from './applications.errors';
import type { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import type { ApplicationRecord, JobPageRecord } from './types/applications.types';

const USER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd123';
const APPLICATION_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const SAVED_STATUS_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd125';
const APPLIED_STATUS_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd126';
const NOW = new Date('2026-10-11T09:00:00.000Z');

function buildStatus(overrides: Partial<StatusRecord> = {}): StatusRecord {
    return {
        id: SAVED_STATUS_ID,
        key: 'saved',
        name: 'Saved',
        color: null,
        position: 0,
        category: 'open',
        ...overrides,
    };
}

function buildApplication(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
    return {
        id: APPLICATION_ID,
        job: {
            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd127',
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
        lastActivityAt: new Date('2026-10-01T09:00:00.000Z'),
        createdAt: new Date('2026-10-01T09:00:00.000Z'),
        updatedAt: new Date('2026-10-01T09:00:00.000Z'),
        ...overrides,
    };
}

describe('ApplicationsService', () => {
    const applicationsRepository = {
        list: jest.fn(),
        findById: jest.fn(),
        findPageByJobId: jest.fn(),
        changeStatus: jest.fn(),
        updateDetails: jest.fn(),
    } as jest.Mocked<ApplicationsRepository>;
    const statusesRepository = {
        listVisible: jest.fn(),
        findVisible: jest.fn(),
    } as jest.Mocked<StatusesRepository>;
    const service = new ApplicationsService(applicationsRepository, statusesRepository);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(NOW);
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should list applications for the current user', async () => {
        const application = buildApplication();
        applicationsRepository.list.mockResolvedValue([application]);

        await expect(service.list(USER_ID)).resolves.toEqual({
            items: [
                {
                    id: APPLICATION_ID,
                    job: application.job,
                    status: application.status,
                    recruiterName: null,
                    recruiterContact: null,
                    notes: null,
                    appliedAt: null,
                    lastActivityAt: '2026-10-01T09:00:00.000Z',
                    createdAt: '2026-10-01T09:00:00.000Z',
                    updatedAt: '2026-10-01T09:00:00.000Z',
                },
            ],
        });
        expect(applicationsRepository.list.mock.calls).toEqual([[USER_ID]]);
    });

    it('should return the job page for the current users application', async () => {
        const application = buildApplication();
        const occurredAt = new Date('2026-10-02T09:00:00.000Z');
        const page: JobPageRecord = {
            application,
            description: 'Build things',
            events: [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd131',
                    type: 'status_changed',
                    occurredAt,
                    payload: { fromStatusId: SAVED_STATUS_ID, toStatusId: APPLIED_STATUS_ID },
                },
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd132',
                    type: 'note',
                    occurredAt,
                    payload: { unexpected: true },
                },
            ],
            cvVersions: [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd133',
                    isBase: false,
                    commitSha: null,
                    createdAt: occurredAt,
                },
            ],
        };
        applicationsRepository.findPageByJobId.mockResolvedValue(page);

        await expect(service.getByJob(USER_ID, application.job.id)).resolves.toEqual({
            application: {
                id: APPLICATION_ID,
                job: application.job,
                status: application.status,
                recruiterName: null,
                recruiterContact: null,
                notes: null,
                appliedAt: null,
                lastActivityAt: '2026-10-01T09:00:00.000Z',
                createdAt: '2026-10-01T09:00:00.000Z',
                updatedAt: '2026-10-01T09:00:00.000Z',
            },
            description: 'Build things',
            events: [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd131',
                    type: 'status_changed',
                    occurredAt: '2026-10-02T09:00:00.000Z',
                    fromStatusId: SAVED_STATUS_ID,
                    toStatusId: APPLIED_STATUS_ID,
                },
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd132',
                    type: 'note',
                    occurredAt: '2026-10-02T09:00:00.000Z',
                    text: '',
                },
            ],
            cvVersions: [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd133',
                    isBase: false,
                    commitSha: null,
                    createdAt: '2026-10-02T09:00:00.000Z',
                },
            ],
        });
    });

    it('should reject a job page when the current user has no application for that job', async () => {
        applicationsRepository.findPageByJobId.mockResolvedValue(null);

        await expect(service.getByJob(USER_ID, '0199bcdf-20fc-744f-bc8b-6ef7c25cd127')).rejects.toBeInstanceOf(
            ApplicationNotFoundError,
        );
    });

    it('should reject a status change when the application is not owned by the current user', async () => {
        applicationsRepository.findById.mockResolvedValue(null);

        await expect(service.changeStatus(USER_ID, APPLICATION_ID, APPLIED_STATUS_ID)).rejects.toBeInstanceOf(
            ApplicationNotFoundError,
        );
        expect(applicationsRepository.changeStatus.mock.calls).toEqual([]);
    });

    it('should reject a status change when the status is not visible to the current user', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(null);

        await expect(service.changeStatus(USER_ID, APPLICATION_ID, APPLIED_STATUS_ID)).rejects.toBeInstanceOf(
            StatusNotFoundError,
        );
        expect(applicationsRepository.changeStatus.mock.calls).toEqual([]);
    });

    it('should leave the application unchanged when the status is already set', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(buildStatus());

        const result = await service.changeStatus(USER_ID, APPLICATION_ID, SAVED_STATUS_ID);

        expect(result.id).toBe(APPLICATION_ID);
        expect(result.status.key).toBe('saved');
        expect(applicationsRepository.changeStatus.mock.calls).toEqual([]);
    });

    it('should record appliedAt when the application enters an active status', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(
            buildStatus({ id: APPLIED_STATUS_ID, key: 'applied', name: 'Applied', position: 1, category: 'active' }),
        );
        applicationsRepository.changeStatus.mockResolvedValue(
            buildApplication({
                status: buildStatus({ id: APPLIED_STATUS_ID, key: 'applied', category: 'active' }),
                appliedAt: NOW,
                lastActivityAt: NOW,
            }),
        );

        await service.changeStatus(USER_ID, APPLICATION_ID, APPLIED_STATUS_ID);

        expect(applicationsRepository.changeStatus.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    fromStatusId: SAVED_STATUS_ID,
                    statusId: APPLIED_STATUS_ID,
                    appliedAt: NOW,
                    lastActivityAt: NOW,
                    occurredAt: NOW,
                },
            ],
        ]);
    });

    it('should record appliedAt when the application skips ahead to an interview status', async () => {
        const screeningId = '0199bcdf-20fc-744f-bc8b-6ef7c25cd128';
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(
            buildStatus({ id: screeningId, key: 'screening', name: 'Screening', position: 2, category: 'interviewing' }),
        );
        applicationsRepository.changeStatus.mockImplementation((_userId, _applicationId, change) =>
            Promise.resolve(buildApplication({ appliedAt: change.appliedAt, lastActivityAt: change.lastActivityAt })),
        );

        await service.changeStatus(USER_ID, APPLICATION_ID, screeningId);

        expect(applicationsRepository.changeStatus.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    fromStatusId: SAVED_STATUS_ID,
                    statusId: screeningId,
                    appliedAt: NOW,
                    lastActivityAt: NOW,
                    occurredAt: NOW,
                },
            ],
        ]);
    });

    it('should keep appliedAt empty when the application moves to a closed status', async () => {
        const rejectedId = '0199bcdf-20fc-744f-bc8b-6ef7c25cd129';
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(
            buildStatus({ id: rejectedId, key: 'rejected', name: 'Rejected', position: 6, category: 'closed' }),
        );
        applicationsRepository.changeStatus.mockImplementation((_userId, _applicationId, change) =>
            Promise.resolve(buildApplication({ appliedAt: change.appliedAt })),
        );

        await service.changeStatus(USER_ID, APPLICATION_ID, rejectedId);

        expect(applicationsRepository.changeStatus.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    fromStatusId: SAVED_STATUS_ID,
                    statusId: rejectedId,
                    appliedAt: null,
                    lastActivityAt: NOW,
                    occurredAt: NOW,
                },
            ],
        ]);
    });

    it('should keep an existing appliedAt when the status changes again', async () => {
        const appliedAt = new Date('2026-10-02T09:00:00.000Z');
        const offerId = '0199bcdf-20fc-744f-bc8b-6ef7c25cd130';
        applicationsRepository.findById.mockResolvedValue(
            buildApplication({
                appliedAt,
                status: buildStatus({ id: APPLIED_STATUS_ID, key: 'applied', category: 'active' }),
            }),
        );
        statusesRepository.findVisible.mockResolvedValue(
            buildStatus({ id: offerId, key: 'offer', name: 'Offer', position: 5, category: 'offer' }),
        );
        applicationsRepository.changeStatus.mockImplementation((_userId, _applicationId, change) =>
            Promise.resolve(buildApplication({ appliedAt: change.appliedAt })),
        );

        await service.changeStatus(USER_ID, APPLICATION_ID, offerId);

        expect(applicationsRepository.changeStatus.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    fromStatusId: APPLIED_STATUS_ID,
                    statusId: offerId,
                    appliedAt,
                    lastActivityAt: NOW,
                    occurredAt: NOW,
                },
            ],
        ]);
    });

    it('should reject a status change when the application disappears before it is saved', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        statusesRepository.findVisible.mockResolvedValue(
            buildStatus({ id: APPLIED_STATUS_ID, key: 'applied', name: 'Applied', position: 1, category: 'active' }),
        );
        applicationsRepository.changeStatus.mockResolvedValue(null);

        await expect(service.changeStatus(USER_ID, APPLICATION_ID, APPLIED_STATUS_ID)).rejects.toBeInstanceOf(
            ApplicationNotFoundError,
        );
    });

    it('should record a note event when notes change', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication());
        applicationsRepository.updateDetails.mockImplementation((_userId, _applicationId, update) =>
            Promise.resolve(buildApplication({ notes: update.notes, lastActivityAt: update.lastActivityAt })),
        );

        await service.updateDetails(USER_ID, APPLICATION_ID, {
            recruiterName: 'Ada',
            recruiterContact: 'ada@example.com',
            notes: '  Called Tuesday  ',
        });

        expect(applicationsRepository.updateDetails.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    recruiterName: 'Ada',
                    recruiterContact: 'ada@example.com',
                    notes: 'Called Tuesday',
                    lastActivityAt: NOW,
                    note: { text: 'Called Tuesday', occurredAt: NOW },
                },
            ],
        ]);
    });

    it('should update recruiter details without a note event', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication({ notes: 'Keep' }));
        applicationsRepository.updateDetails.mockImplementation((_userId, _applicationId, update) =>
            Promise.resolve(buildApplication({ recruiterName: update.recruiterName })),
        );

        await service.updateDetails(USER_ID, APPLICATION_ID, {
            recruiterName: 'Ada',
            recruiterContact: '',
            notes: 'Keep',
        });

        expect(applicationsRepository.updateDetails.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    recruiterName: 'Ada',
                    recruiterContact: null,
                    notes: 'Keep',
                    lastActivityAt: NOW,
                    note: null,
                },
            ],
        ]);
    });

    it('should clear notes without appending a note event', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication({ notes: 'Old' }));
        applicationsRepository.updateDetails.mockImplementation((_userId, _applicationId, update) =>
            Promise.resolve(buildApplication({ notes: update.notes })),
        );

        await service.updateDetails(USER_ID, APPLICATION_ID, {
            recruiterName: '',
            recruiterContact: '',
            notes: '   ',
        });

        expect(applicationsRepository.updateDetails.mock.calls).toEqual([
            [
                USER_ID,
                APPLICATION_ID,
                {
                    recruiterName: null,
                    recruiterContact: null,
                    notes: null,
                    lastActivityAt: NOW,
                    note: null,
                },
            ],
        ]);
    });

    it('should leave details unchanged when the trimmed values are the same', async () => {
        applicationsRepository.findById.mockResolvedValue(buildApplication({ notes: 'Keep', recruiterName: 'Ada' }));

        const result = await service.updateDetails(USER_ID, APPLICATION_ID, {
            recruiterName: ' Ada ',
            recruiterContact: '',
            notes: 'Keep',
        });

        expect(result.notes).toBe('Keep');
        expect(applicationsRepository.updateDetails.mock.calls).toEqual([]);
    });

    it('should reject a details update when the application is not owned by the current user', async () => {
        applicationsRepository.findById.mockResolvedValue(null);

        await expect(
            service.updateDetails(USER_ID, APPLICATION_ID, {
                recruiterName: '',
                recruiterContact: '',
                notes: 'Hello',
            }),
        ).rejects.toBeInstanceOf(ApplicationNotFoundError);
        expect(applicationsRepository.updateDetails.mock.calls).toEqual([]);
    });
});
