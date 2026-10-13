import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createJobHandlers, sampleJobPage } from 'src/test/msw/job.handlers';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it, vi } from 'vitest';

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

    it('should show the posting and the match tab', async () => {
        server.use(...createJobHandlers());

        renderJobPage();

        expect(await screen.findByRole('heading', { name: 'Engineer' })).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Build things')).toBeInTheDocument();
        expect(screen.getByText('Hybrid')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Match' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'CV' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Application kit' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Timeline' })).toBeInTheDocument();
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

    it('should record a follow-up on the timeline', async () => {
        const user = userEvent.setup();
        server.use(...createJobHandlers());

        renderJobPage();
        await screen.findByRole('heading', { name: 'Engineer' });
        await user.click(screen.getByRole('tab', { name: 'Timeline' }));
        await user.click(screen.getByRole('button', { name: 'I followed up' }));

        expect(await screen.findByText('Follow-up')).toBeInTheDocument();
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

        expect(await screen.findByLabelText('Cover letter')).toHaveValue('Hello, I am applying for Engineer at Acme.');
        await user.click(screen.getByRole('button', { name: 'Mark as applied' }));

        await waitFor(() => {
            expect(screen.getByTestId('job-status-chip')).toHaveTextContent('Applied');
        });
        expect(screen.queryByRole('button', { name: 'Mark as applied' })).not.toBeInTheDocument();
    });

    it('should ignore a tab that is not part of the job page', async () => {
        server.use(...createJobHandlers());

        renderJobPage(`/jobs/${jobId}/notes`);

        expect(await screen.findByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
    });

    it('should show a stored match on the match tab', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId/match', () =>
                HttpResponse.json({
                    match: {
                        score: 80,
                        requirements: [
                            {
                                requirement_index: 0,
                                coverage: 'covered',
                                evidence_ids: [],
                                reason: 'Listed on the profile',
                            },
                        ],
                        model: 'test',
                        promptVersion: 'match-1',
                    },
                }),
            ),
            ...createJobHandlers(
                sampleJobPage({
                    requirements: [{ text: 'TypeScript', kind: 'must', category: 'skill', hard: false }],
                }),
            ),
        );

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByText('Score 80')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Covered')).toBeInTheDocument();
        expect(screen.getByText('Listed on the profile')).toBeInTheDocument();
    });

    it('should show a fallback when a matched requirement is no longer on the job', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId/match', () =>
                HttpResponse.json({
                    match: {
                        score: 40,
                        requirements: [
                            {
                                requirement_index: 3,
                                coverage: 'missing',
                                evidence_ids: [],
                                reason: 'No longer listed',
                            },
                        ],
                        model: 'test',
                        promptVersion: 'match-1',
                    },
                }),
            ),
            ...createJobHandlers(
                sampleJobPage({
                    requirements: [{ text: 'TypeScript', kind: 'must', category: 'skill', hard: false }],
                }),
            ),
        );

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByText('Requirement no longer on this job')).toBeInTheDocument();
        expect(screen.getByText('No longer listed')).toBeInTheDocument();
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });

    it('should show an empty state when the job has not been analyzed', async () => {
        const user = userEvent.setup();
        server.use(...createJobHandlers());

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByText('Not analyzed yet')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Engineer' })).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Overview' }));
        expect(await screen.findByText('Build things')).toBeInTheDocument();
    });

    it('should show a load error when the stored match cannot be read', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId/match', () =>
                HttpResponse.json({ statusCode: 500, code: 'MATCH_DATA_INVALID', message: 'Stored match could not be read' }, { status: 500 }),
            ),
            ...createJobHandlers(),
        );

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByText('Match analysis could not be loaded. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Engineer' })).toBeInTheDocument();
    });

    it('should keep the job page usable when match analysis is unavailable', async () => {
        const user = userEvent.setup();
        server.use(
            http.get('http://localhost:3000/api/v1/jobs/:jobId/match', () =>
                HttpResponse.json(
                    { statusCode: 503, code: 'AI_UNAVAILABLE', message: 'Match analysis is unavailable' },
                    { status: 503 },
                ),
            ),
            ...createJobHandlers(),
        );

        renderJobPage(`/jobs/${jobId}/match`);

        expect(await screen.findByText('Match analysis unavailable. Try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Engineer' })).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Overview' }));
        expect(await screen.findByText('Build things')).toBeInTheDocument();
    });

    it('should edit the application kit and download the CV', async () => {
        const user = userEvent.setup();
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const createObjectURL = vi.fn(() => 'blob:cv');
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        server.use(...createJobHandlers());

        renderJobPage();
        await screen.findByRole('heading', { name: 'Engineer' });
        await user.click(screen.getByRole('tab', { name: 'Application kit' }));

        const coverLetter = await screen.findByLabelText('Cover letter');
        expect(coverLetter).toHaveValue('Hello, I am applying for Engineer at Acme.');
        await user.clear(coverLetter);
        await user.type(coverLetter, 'I would like this role.');
        await user.type(screen.getByLabelText('Why this company'), 'The product');
        await user.click(screen.getByRole('button', { name: 'Save kit' }));

        expect(await screen.findByText('Kit saved.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Copy cover letter' }));
        expect(await screen.findByText('Copied Cover letter.')).toBeInTheDocument();
        expect(writeText).toHaveBeenCalledWith('I would like this role.');

        await user.click(screen.getByRole('button', { name: 'Download CV PDF' }));
        await waitFor(() => {
            expect(createObjectURL).toHaveBeenCalled();
        });
    });
});
