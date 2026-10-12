import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { CvPanel } from './CvPanel';

const application = sampleApplication();
const changeId = '0199bcdf-20fc-744f-bc8b-6ef7c25cd410';

function renderPanel() {
    return renderWithProviders(<CvPanel applicationId={application.id} jobId={application.job.id} versions={[]} />);
}

describe('CvPanel', () => {
    it('should accept a proposed change and save a version', async () => {
        const user = userEvent.setup();
        let state = 'proposed';
        const change = () => ({
            id: changeId,
            path: 'summary',
            op: 'replace',
            before: 'Engineer',
            after: 'Backend engineer',
            evidence_ids: [],
            evidence: [],
            rationale: 'Matches the posting',
            state,
            blocked_reason: null,
        });
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/cv-changes', () =>
                HttpResponse.json({ changes: [change()] }),
            ),
            http.patch('http://localhost:3000/api/v1/applications/:applicationId/cv-changes/:changeId', () => {
                state = 'accepted';
                return HttpResponse.json(change());
            }),
            http.post('http://localhost:3000/api/v1/applications/:applicationId/cv-versions', () =>
                HttpResponse.json({
                    version: {
                        id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd411',
                        isBase: false,
                        commitSha: null,
                        createdAt: '2026-10-11T12:00:00.000Z',
                    },
                    githubSynced: false,
                }),
            ),
        );

        renderPanel();

        expect(await screen.findByText('Backend engineer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save version' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Accept' }));
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save version' })).toBeEnabled();
        });
        await user.click(screen.getByRole('button', { name: 'Save version' }));

        expect(await screen.findByText('Saved in Matchbox. GitHub is not connected.')).toBeInTheDocument();
    });

    it('should keep the base CV available when tailoring is unavailable', async () => {
        const user = userEvent.setup();
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/cv-changes', () =>
                HttpResponse.json({ changes: [] }),
            ),
            http.post('http://localhost:3000/api/v1/applications/:applicationId/tailor', () =>
                HttpResponse.json(
                    { statusCode: 503, code: 'AI_UNAVAILABLE', message: 'CV tailoring is unavailable' },
                    { status: 503 },
                ),
            ),
        );

        renderPanel();

        expect(await screen.findByText(/No CV for this job yet/)).toBeInTheDocument();
        await user.click(screen.getByTestId('job-tailor-button'));

        expect(await screen.findByText('CV tailoring is unavailable. Try again, or edit your base CV.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open base CV' })).toHaveAttribute('href', '/cv');
    });

    it('should explain when tailoring is rejected because the draft is closed', async () => {
        const user = userEvent.setup();
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/cv-changes', () =>
                HttpResponse.json({ changes: [] }),
            ),
            http.post('http://localhost:3000/api/v1/applications/:applicationId/tailor', () =>
                HttpResponse.json(
                    { statusCode: 409, message: 'This draft was already saved or closed.' },
                    { status: 409 },
                ),
            ),
        );

        renderPanel();

        await user.click(await screen.findByTestId('job-tailor-button'));

        expect(await screen.findByText('This draft was already saved or closed.')).toBeInTheDocument();
        expect(screen.queryByText('The CV could not be tailored. Please try again.')).not.toBeInTheDocument();
    });

    it('should explain when a save loses the race', async () => {
        const user = userEvent.setup();
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/cv-changes', () =>
                HttpResponse.json({
                    changes: [
                        {
                            id: changeId,
                            path: 'summary',
                            op: 'replace',
                            before: 'Engineer',
                            after: 'Backend engineer',
                            evidence_ids: [],
                            evidence: [],
                            rationale: 'Matches the posting',
                            state: 'accepted',
                            blocked_reason: null,
                        },
                    ],
                }),
            ),
            http.post('http://localhost:3000/api/v1/applications/:applicationId/cv-versions', () =>
                HttpResponse.json(
                    { statusCode: 409, message: 'This draft was already saved or closed.' },
                    { status: 409 },
                ),
            ),
        );

        renderPanel();

        await user.click(await screen.findByRole('button', { name: 'Save version' }));

        expect(await screen.findByText('This draft was already saved or closed.')).toBeInTheDocument();
        expect(screen.queryByText('The CV version could not be saved. Please try again.')).not.toBeInTheDocument();
    });

    it('should not offer accept on a blocked change', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/cv-changes', () =>
                HttpResponse.json({
                    changes: [
                        {
                            id: changeId,
                            path: 'summary',
                            op: 'replace',
                            before: null,
                            after: 'Invented a claim',
                            evidence_ids: [],
                            evidence: [],
                            rationale: '',
                            state: 'blocked',
                            blocked_reason: 'No career evidence supports this change',
                        },
                    ],
                }),
            ),
        );

        renderPanel();

        expect(await screen.findByText('No career evidence supports this change')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save version' })).toBeDisabled();
    });
});
