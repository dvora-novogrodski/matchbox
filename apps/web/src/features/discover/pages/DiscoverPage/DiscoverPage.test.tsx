import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createDiscoverHandlers, sampleDiscoverItem } from 'src/test/msw/discover.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { DiscoverPage } from './DiscoverPage';

describe('DiscoverPage', () => {
    it('should show a loading state while matches are loading', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/discover', async () => {
                await delay('infinite');
                return HttpResponse.json({ items: [] });
            }),
        );

        renderWithProviders(<DiscoverPage />);

        expect(await screen.findByTestId('discover-loading')).toBeInTheDocument();
    });

    it('should show an error when matches cannot be loaded', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/discover', () =>
                HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
            ),
        );

        renderWithProviders(<DiscoverPage />);

        expect(await screen.findByText('Matches could not be loaded. Please try again.')).toBeInTheDocument();
    });

    it('should show an empty queue when there are no matches', async () => {
        server.use(...createDiscoverHandlers());

        renderWithProviders(<DiscoverPage />);

        expect(await screen.findByRole('heading', { name: 'Discover' })).toBeInTheDocument();
        expect(await screen.findByText('No new matches to review.')).toBeInTheDocument();
    });

    it('should save a match and remove it from the queue', async () => {
        const user = userEvent.setup();
        const item = sampleDiscoverItem();
        server.use(...createDiscoverHandlers([item]));

        renderWithProviders(<DiscoverPage />);

        expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument();
        expect(screen.getByText('Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tel Aviv · Hybrid')).toBeInTheDocument();
        expect(screen.getByText('Match 82')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View posting' })).toHaveAttribute(
            'href',
            'https://example.com/jobs/1',
        );

        await user.click(screen.getByRole('button', { name: 'Save Engineer' }));

        await waitFor(() => {
            expect(screen.getByText('No new matches to review.')).toBeInTheDocument();
        });
    });

    it('should skip a match and remove it from the queue', async () => {
        const user = userEvent.setup();
        server.use(...createDiscoverHandlers([sampleDiscoverItem()]));

        renderWithProviders(<DiscoverPage />);
        await screen.findByRole('heading', { name: 'Acme' });
        await user.click(screen.getByRole('button', { name: 'Skip Engineer' }));

        await waitFor(() => {
            expect(screen.getByText('No new matches to review.')).toBeInTheDocument();
        });
    });

    it('should show an error when a save fails', async () => {
        const user = userEvent.setup();
        const item = sampleDiscoverItem();
        server.use(
            http.post('http://localhost:3000/api/v1/jobs/:jobId/save', () =>
                HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
            ),
            ...createDiscoverHandlers([item]),
        );

        renderWithProviders(<DiscoverPage />);
        await screen.findByRole('heading', { name: 'Acme' });
        await user.click(screen.getByRole('button', { name: 'Save Engineer' }));

        expect(await screen.findByText('This job could not be saved. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    });
});
