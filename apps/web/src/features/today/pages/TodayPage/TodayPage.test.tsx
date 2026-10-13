import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { server } from 'src/test/msw/server';
import { createTodayHandlers, sampleToday, sampleTodayApplication, sampleTodayMatch } from 'src/test/msw/today.handlers';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { TodayPage } from './TodayPage';

describe('TodayPage', () => {
    it('should show a loading state while today is loading', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/today', async () => {
                await delay('infinite');
                return HttpResponse.json(sampleToday());
            }),
        );

        renderWithProviders(<TodayPage />);

        expect(await screen.findByTestId('today-loading')).toBeInTheDocument();
    });

    it('should show an error when today cannot be loaded', async () => {
        server.use(http.get('http://localhost:3000/api/v1/today', () => new HttpResponse(null, { status: 500 })));

        renderWithProviders(<TodayPage />);

        expect(await screen.findByText('Today could not be loaded. Please try again.')).toBeInTheDocument();
    });

    it('should show an empty day when nothing needs attention', async () => {
        server.use(...createTodayHandlers());

        renderWithProviders(<TodayPage />);

        expect(await screen.findByText('Nothing needs you right now.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
        expect(screen.getByText('0 matches to review')).toBeInTheDocument();
        expect(screen.getByText('0 CVs to tailor')).toBeInTheDocument();
        expect(screen.getByText('0 follow-ups due')).toBeInTheDocument();
        expect(screen.getByText('0 in progress')).toBeInTheDocument();
    });

    it('should list matches, cvs to tailor, and follow-ups', async () => {
        const match = sampleTodayMatch();
        const toTailor = sampleTodayApplication();
        const followUp = sampleTodayApplication({
            applicationId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd504',
            jobId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd505',
            title: 'Waiting',
            companyName: 'Stale Co',
            lastActivityAt: '2026-10-01T09:00:00.000Z',
        });
        server.use(
            ...createTodayHandlers(
                sampleToday({
                    matches: [match],
                    toTailor: [toTailor],
                    followUps: [followUp],
                    stats: { matches: 1, toTailor: 1, followUps: 1, inProgress: 2 },
                }),
            ),
        );

        renderWithProviders(<TodayPage />);

        expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
        expect(screen.getByText('Match 82')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Review Engineer' })).toHaveAttribute('href', '/discover');
        expect(screen.getByRole('heading', { name: 'Tailor a CV' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Tailor CV for Designer' })).toHaveAttribute(
            'href',
            `/jobs/${toTailor.jobId}/cv`,
        );
        expect(screen.getByRole('heading', { name: 'Follow up' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open Waiting' })).toHaveAttribute(
            'href',
            `/jobs/${followUp.jobId}/timeline`,
        );
        expect(screen.getByText('1 match to review')).toBeInTheDocument();
        expect(screen.getByText('2 in progress')).toBeInTheDocument();
    });
});
