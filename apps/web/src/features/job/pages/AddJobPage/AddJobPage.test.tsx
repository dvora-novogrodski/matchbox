import { Box } from '@matchbox/ui';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { AddJobPage } from './AddJobPage';

function renderAddJobPage() {
    return renderWithProviders(
        <Routes>
            <Route element={<AddJobPage />} path="/jobs/new" />
            <Route element={<Box data-test="job-add-opened" />} path="/jobs/:jobId/overview" />
        </Routes>,
        { initialEntries: ['/jobs/new'] },
    );
}

describe('AddJobPage', () => {
    it('should require a company and a role', async () => {
        const user = userEvent.setup();
        renderAddJobPage();

        await user.click(screen.getByRole('button', { name: 'Add job' }));

        expect(await screen.findByText('Enter a company name.')).toBeInTheDocument();
        expect(screen.getByText('Enter a role.')).toBeInTheDocument();
    });

    it('should save a job and open it', async () => {
        const user = userEvent.setup();
        const application = sampleApplication();
        server.use(http.post('http://localhost:3000/api/v1/jobs', () => HttpResponse.json(application, { status: 201 })));

        renderAddJobPage();
        await user.type(screen.getByLabelText('Company'), 'Acme');
        await user.type(screen.getByLabelText('Role'), 'Engineer');
        await user.click(screen.getByRole('button', { name: 'Add job' }));

        expect(await screen.findByTestId('job-add-opened')).toBeInTheDocument();
    });

    it('should offer the existing job when the link was already saved', async () => {
        const user = userEvent.setup();
        const application = sampleApplication();
        server.use(
            http.post('http://localhost:3000/api/v1/jobs', () =>
                HttpResponse.json(
                    { statusCode: 409, code: 'APPLICATION_ALREADY_EXISTS', message: 'exists', jobId: application.job.id },
                    { status: 409 },
                ),
            ),
        );

        renderAddJobPage();
        await user.type(screen.getByLabelText('Company'), 'Acme');
        await user.type(screen.getByLabelText('Role'), 'Engineer');
        await user.click(screen.getByRole('button', { name: 'Add job' }));

        expect(await screen.findByText('This job is already in your pipeline.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open it' })).toHaveAttribute(
            'href',
            `/jobs/${application.job.id}/overview`,
        );
    });
});
