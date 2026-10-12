import { type DiscoverItem, DiscoverItemSchema, DiscoverListSchema } from '@matchbox/shared';
import { http, HttpResponse } from 'msw';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';

const baseUrl = 'http://localhost:3000/api/v1';

export function sampleDiscoverItem(overrides: Partial<DiscoverItem> = {}): DiscoverItem {
    return DiscoverItemSchema.parse({
        jobId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd501',
        title: 'Engineer',
        companyName: 'Acme',
        location: 'Tel Aviv',
        workMode: 'hybrid',
        url: 'https://example.com/jobs/1',
        description: 'Build things',
        score: 82,
        ...overrides,
    });
}

export function createDiscoverHandlers(items: DiscoverItem[] = []) {
    const queue = [...items];
    return [
        http.get(`${baseUrl}/discover`, () => HttpResponse.json(DiscoverListSchema.parse({ items: queue }))),
        http.post(`${baseUrl}/jobs/:jobId/save`, ({ params }) => {
            const index = queue.findIndex((item) => item.jobId === params.jobId);
            if (index >= 0) {
                queue.splice(index, 1);
            }
            return HttpResponse.json(sampleApplication());
        }),
        http.post(`${baseUrl}/jobs/:jobId/skip`, ({ params }) => {
            const index = queue.findIndex((item) => item.jobId === params.jobId);
            if (index >= 0) {
                queue.splice(index, 1);
            }
            return new HttpResponse(null, { status: 204 });
        }),
    ];
}
