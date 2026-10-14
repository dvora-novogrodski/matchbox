import type { Today, TodayApplication, TodayMatch } from '@matchbox/shared';
import { TodayApplicationSchema, TodayMatchSchema, TodaySchema } from '@matchbox/shared';
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:3000/api/v1';

export function sampleTodayMatch(overrides: Partial<TodayMatch> = {}): TodayMatch {
    return TodayMatchSchema.parse({
        jobId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd501',
        title: 'Engineer',
        companyName: 'Acme',
        jobUrl: 'https://acme.example/jobs/engineer',
        score: 82,
        ...overrides,
    });
}

export function sampleTodayApplication(overrides: Partial<TodayApplication> = {}): TodayApplication {
    return TodayApplicationSchema.parse({
        applicationId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd502',
        jobId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd503',
        title: 'Designer',
        companyName: 'Northwind',
        jobUrl: 'https://northwind.example/jobs/designer',
        lastActivityAt: '2026-10-10T09:00:00.000Z',
        ...overrides,
    });
}

export function sampleToday(overrides: Partial<Today> = {}): Today {
    return TodaySchema.parse({
        matches: [],
        toTailor: [],
        followUps: [],
        stats: { matches: 0, toTailor: 0, followUps: 0, inProgress: 0 },
        ...overrides,
    });
}

export function createTodayHandlers(today: Today = sampleToday()) {
    return [http.get(`${baseUrl}/today`, () => HttpResponse.json(TodaySchema.parse(today)))];
}
