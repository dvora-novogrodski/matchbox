import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createJobHandlers } from 'src/test/msw/job.handlers';
import { sampleApplication } from 'src/test/msw/pipeline.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { KitPanel } from './KitPanel';

const application = sampleApplication();

function renderKit() {
    return renderWithProviders(
        <KitPanel applicationId={application.id} companyName={application.job.companyName} title={application.job.title} />,
    );
}

describe('KitPanel', () => {
    it('should show a saved cover letter', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/kit', () =>
                HttpResponse.json({
                    coverLetter: 'My letter',
                    whyCompany: 'Because',
                    whyRole: 'The work',
                    aboutYou: 'I build',
                    saved: true,
                }),
            ),
            ...createJobHandlers(),
        );

        renderKit();

        expect(await screen.findByLabelText('Cover letter')).toHaveValue('My letter');
        expect(screen.queryByDisplayValue('Hello, I am applying for Engineer at Acme.')).not.toBeInTheDocument();
    });

    it('should keep a cover letter that was saved empty', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/kit', () =>
                HttpResponse.json({
                    coverLetter: '',
                    whyCompany: 'Because',
                    whyRole: '',
                    aboutYou: '',
                    saved: true,
                }),
            ),
            ...createJobHandlers(),
        );

        renderKit();

        expect(await screen.findByLabelText('Cover letter')).toHaveValue('');
        expect(screen.getByLabelText('Why this company')).toHaveValue('Because');
    });

    it('should show an error when the kit cannot be loaded', async () => {
        server.use(
            http.get('http://localhost:3000/api/v1/applications/:applicationId/kit', () =>
                HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
            ),
            ...createJobHandlers(),
        );

        renderKit();

        expect(await screen.findByText('The kit could not be loaded. Please try again.')).toBeInTheDocument();
    });
});
