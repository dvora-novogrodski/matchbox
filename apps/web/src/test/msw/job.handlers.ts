import {
    type ApplicationEvent,
    ApplicationKitSchema,
    ApplicationSchema,
    type JobPage,
    JobPageSchema,
    type Status,
    StatusListSchema,
    UpdateApplicationKitSchema,
    UpdateApplicationSchema,
} from '@matchbox/shared';
import { http, HttpResponse } from 'msw';
import { sampleApplication, systemStatuses } from 'src/test/msw/pipeline.handlers';

const baseUrl = 'http://localhost:3000/api/v1';

export function sampleJobPage(overrides: Partial<JobPage> = {}): JobPage {
    return JobPageSchema.parse({
        application: sampleApplication(),
        description: 'Build things',
        requirements: [],
        events: [],
        cvVersions: [],
        ...overrides,
    });
}

function noteEvent(text: string): ApplicationEvent {
    return {
        id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd501',
        type: 'note',
        occurredAt: new Date().toISOString(),
        text,
    };
}

export function createJobHandlers(page: JobPage = sampleJobPage(), statuses: Status[] = systemStatuses()) {
    const state = {
        page: JobPageSchema.parse(structuredClone(page)),
        statuses,
        kit: ApplicationKitSchema.parse({
            coverLetter: '',
            whyCompany: '',
            whyRole: '',
            aboutYou: '',
            saved: false,
        }),
    };

    return [
        http.get(`${baseUrl}/statuses`, () => HttpResponse.json(StatusListSchema.parse({ items: state.statuses }))),
        http.get(`${baseUrl}/jobs/:jobId/match`, () => HttpResponse.json({ match: null })),
        http.get(`${baseUrl}/applications/:applicationId/cv-changes`, () => HttpResponse.json({ changes: [] })),
        http.get(`${baseUrl}/jobs/:jobId`, ({ params }) => {
            if (params.jobId !== state.page.application.job.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
                    { status: 404 },
                );
            }
            return HttpResponse.json(JobPageSchema.parse(state.page));
        }),
        http.patch(`${baseUrl}/applications/:applicationId`, async ({ params, request }) => {
            const input = UpdateApplicationSchema.parse(await request.json());
            if (params.applicationId !== state.page.application.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
                    { status: 404 },
                );
            }
            const notes = input.notes.trim();
            const previousNotes = state.page.application.notes;
            state.page.application = ApplicationSchema.parse({
                ...state.page.application,
                recruiterName: input.recruiterName.trim() || null,
                recruiterContact: input.recruiterContact.trim() || null,
                notes: notes || null,
                updatedAt: new Date().toISOString(),
            });
            if (notes && notes !== previousNotes) {
                state.page.events = [noteEvent(notes), ...state.page.events];
            }
            return HttpResponse.json(ApplicationSchema.parse(state.page.application));
        }),
        http.patch(`${baseUrl}/applications/:applicationId/status`, async ({ params, request }) => {
            const body = (await request.json()) as { statusId?: string };
            const status = state.statuses.find((item) => item.id === body.statusId);
            if (params.applicationId !== state.page.application.id || !status) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
                    { status: 404 },
                );
            }
            const now = new Date().toISOString();
            const recordsAppliedAt =
                status.category === 'active' || status.category === 'interviewing' || status.category === 'offer';
            state.page.application = ApplicationSchema.parse({
                ...state.page.application,
                status,
                lastActivityAt: now,
                updatedAt: now,
                appliedAt: state.page.application.appliedAt ?? (recordsAppliedAt ? now : null),
            });
            state.page.events = [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd502',
                    type: 'status_changed',
                    occurredAt: now,
                    fromStatusId: null,
                    toStatusId: status.id,
                },
                ...state.page.events,
            ];
            return HttpResponse.json(ApplicationSchema.parse(state.page.application));
        }),
        http.post(`${baseUrl}/applications/:applicationId/follow-ups`, ({ params }) => {
            if (params.applicationId !== state.page.application.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'FOLLOW_UP_NOT_FOUND', message: 'This application was not found' },
                    { status: 404 },
                );
            }
            const now = new Date().toISOString();
            state.page.application = ApplicationSchema.parse({
                ...state.page.application,
                lastActivityAt: now,
                updatedAt: now,
            });
            state.page.events = [
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd503',
                    type: 'follow_up',
                    occurredAt: now,
                },
                ...state.page.events,
            ];
            return new HttpResponse(null, { status: 204 });
        }),
        http.get(`${baseUrl}/applications/:applicationId/kit`, ({ params }) => {
            if (params.applicationId !== state.page.application.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'KIT_NOT_FOUND', message: 'This application was not found' },
                    { status: 404 },
                );
            }
            return HttpResponse.json(ApplicationKitSchema.parse(state.kit));
        }),
        http.put(`${baseUrl}/applications/:applicationId/kit`, async ({ params, request }) => {
            const input = UpdateApplicationKitSchema.parse(await request.json());
            if (params.applicationId !== state.page.application.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'KIT_NOT_FOUND', message: 'This application was not found' },
                    { status: 404 },
                );
            }
            state.kit = ApplicationKitSchema.parse({ ...input, saved: true });
            return HttpResponse.json(state.kit);
        }),
        http.get(`${baseUrl}/applications/:applicationId/kit/pdf`, ({ params }) => {
            if (params.applicationId !== state.page.application.id) {
                return HttpResponse.json(
                    { statusCode: 404, code: 'KIT_NOT_FOUND', message: 'This application was not found' },
                    { status: 404 },
                );
            }
            return new HttpResponse('%PDF-1.4', { headers: { 'content-type': 'application/pdf' } });
        }),
    ];
}
