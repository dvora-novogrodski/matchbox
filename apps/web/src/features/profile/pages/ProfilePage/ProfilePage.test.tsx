import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createProfileHandlers, emptyProfile } from 'src/test/msw/profile.handlers';
import { server } from 'src/test/msw/server';
import { renderWithProviders } from 'src/test/render-with-providers';
import { describe, expect, it } from 'vitest';

import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
    it('should render grouped profile sections', async () => {
        server.use(...createProfileHandlers({ profile: emptyProfile() }));

        renderWithProviders(<ProfilePage />);

        expect(await screen.findByRole('heading', { name: 'Experience' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
    });

    it('should create an experience from its section dialog', async () => {
        server.use(...createProfileHandlers({ profile: emptyProfile() }));
        const user = userEvent.setup();

        renderWithProviders(<ProfilePage />);
        await screen.findByRole('heading', { name: 'Experience' });
        await user.click(screen.getAllByRole('button', { name: 'Add' })[0]);
        const dialog = await screen.findByRole('dialog');
        await user.type(within(dialog).getByRole('textbox', { name: /^Title/ }), 'Software Engineer');
        await user.type(within(dialog).getByRole('textbox', { name: 'Organization' }), 'Acme');
        await user.click(within(dialog).getByRole('button', { name: 'Add bullet' }));
        await user.type(within(dialog).getByLabelText('Bullet'), 'Built reliable services.');
        await user.click(within(dialog).getByRole('button', { name: 'Add' }));

        expect(await screen.findByRole('heading', { name: 'Software Engineer' })).toBeInTheDocument();
    });

    it('should edit skills with a single section control', async () => {
        server.use(...createProfileHandlers({ profile: emptyProfile() }));
        const user = userEvent.setup();

        renderWithProviders(<ProfilePage />);
        await user.click(await screen.findByRole('button', { name: 'Edit skills' }));
        const input = screen.getByLabelText('Skills');
        await user.type(input, 'TypeScript{enter}');
        await user.click(screen.getByRole('button', { name: 'Save skills' }));

        await waitFor(() => expect(screen.getByText('TypeScript')).toBeInTheDocument());
    });
});
