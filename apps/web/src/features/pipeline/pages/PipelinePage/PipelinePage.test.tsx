import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createPipelineHandlers, sampleApplication, systemStatuses } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { PipelinePage } from './PipelinePage';

describe('PipelinePage', () => {
    it('should show a loading state while applications are loading', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications', async () => {
                await delay('infinite');
                return HttpResponse.json({ items: [] });
            }),
            ...createPipelineHandlers(),
        );

        renderWithProviders(<PipelinePage />);

        expect(await screen.findByTestId('pipeline-loading')).toBeInTheDocument();
    });

    it('should show an error when applications cannot be loaded', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications', () =>
                HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
            ),
            ...createPipelineHandlers(),
        );

        renderWithProviders(<PipelinePage />);

        expect(await screen.findByText('Applications could not be loaded. Please try again.')).toBeInTheDocument();
    });

    it('should show an empty board of statuses when there are no applications', async () => {
        server.use(...createPipelineHandlers());

        renderWithProviders(<PipelinePage />);

        expect(await screen.findByRole('heading', { name: 'Pipeline' })).toBeInTheDocument();
        expect(await screen.findByText('No applications yet. Jobs you save will show up here.')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Saved' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Withdrawn' })).toBeInTheDocument();
    });

    it('should move an application to another status from the board', async () => {
        const user = userEvent.setup();
        const statuses = systemStatuses();
        const application = sampleApplication();
        server.use(...createPipelineHandlers({ statuses, applications: [application] }));

        renderWithProviders(<PipelinePage />);

        const saved = await screen.findByRole('region', { name: 'Saved' });
        expect(within(saved).getByText('Acme')).toBeInTheDocument();
        expect(within(saved).getByText(/Saved\s+1/)).toBeInTheDocument();

        await user.click(within(saved).getByRole('button', { name: 'More actions for Engineer' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Applied' }));

        await waitFor(() => {
            expect(within(screen.getByRole('region', { name: 'Applied' })).getByText('Acme')).toBeInTheDocument();
        });
        expect(within(screen.getByRole('region', { name: 'Saved' })).getByText('Nothing here')).toBeInTheDocument();
    });

    it('should switch to the table and change status there', async () => {
        const user = userEvent.setup();
        const statuses = systemStatuses();
        const application = sampleApplication();
        server.use(...createPipelineHandlers({ statuses, applications: [application] }));

        renderWithProviders(<PipelinePage />);
        await screen.findByRole('region', { name: 'Saved' });
        await user.click(screen.getByRole('button', { name: 'Table' }));

        expect(await screen.findByTestId('pipeline-table')).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Acme' })).toBeInTheDocument();
        expect(screen.getByText('Not yet')).toBeInTheDocument();

        await user.click(screen.getByRole('combobox', { name: 'Status for Engineer' }));
        await user.click(await screen.findByRole('option', { name: 'Screening' }));

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: 'Status for Engineer' })).toHaveTextContent('Screening');
        });
    });
});
