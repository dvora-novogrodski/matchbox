import { type CvEditor,CvEditorSchema } from '@matchbox/shared';
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:3000/api/v1/cv';

export function sampleCvEditor(overrides: Partial<CvEditor> = {}): CvEditor {
    return CvEditorSchema.parse({
        selection: {
            header: {
                fullName: 'Ada Lovelace',
                headline: 'Engineer',
                email: 'ada@example.com',
                phone: null,
                location: null,
                links: [],
            },
            summary: 'Built early programs.',
            experienceItemIds: ['0199bcdf-20fc-744f-bc8b-6ef7c25cd201'],
            projectItemIds: [],
            skillIds: [],
            educationItemIds: [],
        },
        document: {
            header: {
                fullName: 'Ada Lovelace',
                headline: 'Engineer',
                email: 'ada@example.com',
                phone: null,
                location: null,
                links: [],
            },
            summary: 'Built early programs.',
            experience: [
                {
                    careerItemId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd201',
                    title: 'Engineer',
                    organization: 'Analytical Engines',
                    startDate: null,
                    endDate: null,
                    tech: [],
                    bullets: ['Wrote the notes.'],
                },
            ],
            projects: [],
            skills: [],
            education: [],
        },
        html: '<html><body><h1>Ada Lovelace</h1></body></html>',
        isCustomized: true,
        catalog: {
            experience: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd201', title: 'Engineer', subtitle: 'Analytical Engines' }],
            projects: [],
            skills: [],
            education: [],
        },
        latestVersion: null,
        github: { repo: null, connected: false },
        templateId: 'default',
        ...overrides,
    });
}

export function createCvHandlers(editor: CvEditor) {
    let current = editor;
    return [
        http.get(baseUrl, () => HttpResponse.json(current)),
        http.put(baseUrl, async ({ request }) => {
            const selection = (await request.json()) as CvEditor['selection'];
            current = {
                ...current,
                selection,
                document: { ...current.document, header: selection.header, summary: selection.summary },
                html: `<html><body><h1>${selection.header.fullName}</h1><p>${selection.summary}</p></body></html>`,
            };
            return HttpResponse.json(current);
        }),
        http.get(`${baseUrl}/pdf`, () => new HttpResponse('%PDF-1.4', { headers: { 'content-type': 'application/pdf' } })),
        http.post(`${baseUrl}/versions`, () =>
            HttpResponse.json(
                {
                    id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd301',
                    isBase: true,
                    templateId: 'default',
                    gitPath: 'cvs/base.json',
                    commitSha: null,
                    createdAt: '2026-10-10T12:00:00.000Z',
                },
                { status: 201 },
            ),
        ),
    ];
}
