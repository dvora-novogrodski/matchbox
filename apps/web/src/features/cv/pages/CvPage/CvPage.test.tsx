import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createCvHandlers, sampleCvEditor } from 'src/test/msw/cv.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { CvPage } from './CvPage';

describe('CvPage', () => {
    it('should show the base CV and a preview of the saved document', async () => {
        server.use(...createCvHandlers(sampleCvEditor()));

        renderWithProviders(<CvPage />);

        expect(await screen.findByRole('heading', { name: 'CV' })).toBeInTheDocument();
        expect(await screen.findByRole('textbox', { name: 'Full name' })).toHaveValue('Ada Lovelace');
        expect(screen.getByRole('checkbox', { name: 'Engineer — Analytical Engines' })).toBeChecked();
        expect(screen.getByTitle('CV preview')).toHaveAttribute('srcdoc', expect.stringContaining('Ada Lovelace'));
        expect(screen.getByText('GitHub is not connected. Versions stay in Matchbox until you connect a repository.')).toBeInTheDocument();
    });

    it('should save a changed summary', async () => {
        server.use(...createCvHandlers(sampleCvEditor()));
        const user = userEvent.setup();

        renderWithProviders(<CvPage />);
        const summary = await screen.findByRole('textbox', { name: 'Summary' });
        await user.clear(summary);
        await user.type(summary, 'Updated summary.');
        await user.click(screen.getByRole('button', { name: 'Save base CV' }));

        expect(await screen.findByTitle('CV preview')).toHaveAttribute('srcdoc', expect.stringContaining('Updated summary.'));
    });

    it('should warn when selected items no longer exist in the profile', async () => {
        server.use(...createCvHandlers(sampleCvEditor({ removedItemCount: 2 })));

        renderWithProviders(<CvPage />);

        expect(await screen.findByText('2 items you selected no longer exist in your profile.')).toBeInTheDocument();
    });

    it('should show an error when the CV cannot be loaded', async () => {
        server.use(http.get('http://localhost:3000/api/v1/cv', () => new HttpResponse(null, { status: 500 })));

        renderWithProviders(<CvPage />);

        expect(await screen.findByText('The CV could not be loaded. Please try again.')).toBeInTheDocument();
    });
});
