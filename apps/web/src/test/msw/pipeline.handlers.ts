import {
    type Application,
    ApplicationListSchema,
    ApplicationSchema,
    ChangeApplicationStatusSchema,
    type Status,
    StatusListSchema,
    SYSTEM_STATUSES,
    type SystemStatusKey,
} from '@matchbox/shared';
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:3000/api/v1';

const STATUS_IDS: Record<SystemStatusKey, string> = {
    saved: '0199bcdf-20fc-744f-bc8b-6ef7c25cd301',
    applied: '0199bcdf-20fc-744f-bc8b-6ef7c25cd302',
    screening: '0199bcdf-20fc-744f-bc8b-6ef7c25cd303',
    technical: '0199bcdf-20fc-744f-bc8b-6ef7c25cd304',
    hr: '0199bcdf-20fc-744f-bc8b-6ef7c25cd305',
    offer: '0199bcdf-20fc-744f-bc8b-6ef7c25cd306',
    rejected: '0199bcdf-20fc-744f-bc8b-6ef7c25cd307',
    withdrawn: '0199bcdf-20fc-744f-bc8b-6ef7c25cd308',
};

export function systemStatuses(): Status[] {
    return SYSTEM_STATUSES.map((status) => ({
        id: STATUS_IDS[status.key],
        key: status.key,
        name: status.name,
        color: null,
        position: SYSTEM_STATUSES.findIndex((candidate) => candidate.key === status.key),
        category: status.category,
    }));
}

export function sampleApplication(overrides: Partial<Application> = {}): Application {
    const saved = systemStatuses()[0];
    return ApplicationSchema.parse({
        id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd401',
        job: {
            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd402',
            title: 'Engineer',
            companyName: 'Acme',
            location: 'Tel Aviv',
            workMode: 'hybrid',
            url: 'https://example.com/jobs/1',
        },
        status: saved,
        recruiterName: null,
        recruiterContact: null,
        notes: null,
        appliedAt: null,
        lastActivityAt: '2026-10-09T12:00:00.000Z',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-09T12:00:00.000Z',
        ...overrides,
    });
}

type PipelineState = {
    statuses: Status[];
    applications: Application[];
};

export function createPipelineHandlers(state: PipelineState = { statuses: systemStatuses(), applications: [] }) {
    return [
        http.get(`${baseUrl}/statuses`, () => HttpResponse.json(StatusListSchema.parse({ items: state.statuses }))),
        http.get(`${baseUrl}/applications`, () =>
            HttpResponse.json(ApplicationListSchema.parse({ items: state.applications })),
        ),
        http.patch(`${baseUrl}/applications/:applicationId/status`, async ({ params, request }) => {
            const input = ChangeApplicationStatusSchema.parse(await request.json());
            const application = state.applications.find((item) => item.id === params.applicationId);
            const status = state.statuses.find((item) => item.id === input.statusId);
            if (!application || !status) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
                    { status: 404 },
                );
            }
            const now = new Date().toISOString();
            application.status = status;
            application.lastActivityAt = now;
            application.updatedAt = now;
            const recordsAppliedAt =
                status.category === 'active' || status.category === 'interviewing' || status.category === 'offer';
            if (!application.appliedAt && recordsAppliedAt) {
                application.appliedAt = now;
            }
            return HttpResponse.json(ApplicationSchema.parse(application));
        }),
    ];
}
