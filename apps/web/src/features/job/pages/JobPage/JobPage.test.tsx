import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createJobHandlers, sampleJobPage } from 'src/test/msw/job.handlers';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { JobPage } from './JobPage';

const jobId = sampleApplication().job.id;

function renderJobPage(path = `/jobs/${jobId}/overview`) {
    return renderWithProviders(<JobPage />, { initialEntries: [path], path: '/jobs/:jobId/:tab?' });
}

describe('JobPage', () => {
    it('should show a loading state while the job is loading', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId', async () => {
                await delay('infinite');
                return HttpResponse.json({});
            }),
            ...createJobHandlers(),
        );

        renderJobPage();

        expect(await screen.findByTestId('job-loading')).toBeInTheDocument();
    });

    it('should show an error when the job cannot be loaded', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId', () =>
                HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
            ),
            ...createJobHandlers(),
        );

        renderJobPage();

        expect(await screen.findByText('This job could not be loaded. Please try again.')).toBeInTheDocument();
    });

    it('should show a not-found message for a job outside the pipeline', async () => {
        server.use(...createJobHandlers());

        renderJobPage('/jobs/0199bcdf-20fc-744f-bc8b-6ef7c25cd499/overview');

        expect(await screen.findByText('This job is not in your pipeline.')).toBeInTheDocument();
    });

    it('should show the posting and hide match analysis', async () => {
        server.use(...createJobHandlers());

        renderJobPage();

        expect(await screen.findByRole('heading', { name: 'Engineer' })).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Build things')).toBeInTheDocument();
        expect(screen.getByText('Hybrid')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'CV' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Application kit' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Timeline' })).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'Match' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tailor CV' })).toBeInTheDocument();
    });

    it('should save a note and show it on the timeline', async () => {
        const user = userEvent.setup();
        server.use(...createJobHandlers());

        renderJobPage();
        await screen.findByRole('heading', { name: 'Engineer' });
        await user.type(screen.getByLabelText('Notes'), 'Called Tuesday');
        await user.click(screen.getByRole('button', { name: 'Save' }));
        await user.click(screen.getByRole('tab', { name: 'Timeline' }));

        expect(await screen.findByText('Called Tuesday')).toBeInTheDocument();
    });

    it('should open the CV tab from the primary action when there is no CV', async () => {
        const user = userEvent.setup();
        server.use(...createJobHandlers());

        renderJobPage();
        await screen.findByRole('heading', { name: 'Engineer' });
        await user.click(screen.getByRole('button', { name: 'Tailor CV' }));

        expect(await screen.findByText(/No CV for this job yet/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open base CV' })).toHaveAttribute('href', '/cv');
    });

    it('should move from preparing an application to marking it applied', async () => {
        const user = userEvent.setup();
        const application = sampleApplication();
        server.use(
            ...createJobHandlers(
                sampleJobPage({
                    application,
                    cvVersions: [
                        {
                            id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd403',
                            isBase: false,
                            commitSha: 'abc1234',
                            createdAt: '2026-10-10T12:00:00.000Z',
                        },
                    ],
                }),
            ),
        );

        renderJobPage();
        await screen.findByRole('heading', { name: 'Engineer' });
        await user.click(screen.getByRole('button', { name: 'Prepare to apply' }));

        expect(await screen.findByText('Hello, I am applying for Engineer at Acme.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Mark as applied' }));

        await waitFor(() => {
            expect(screen.getByTestId('job-status-chip')).toHaveTextContent('Applied');
        });
        expect(screen.queryByRole('button', { name: 'Mark as applied' })).not.toBeInTheDocument();
    });

    it('should ignore a tab that is not part of the job page', async () => {
        server.use(...createJobHandlers());

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'Match' })).not.toBeInTheDocument();
    });
});
