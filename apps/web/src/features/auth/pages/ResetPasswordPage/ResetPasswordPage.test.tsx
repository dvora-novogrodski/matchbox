import { ThemeProvider } from '@matchbox/ui';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePasswordReset } from '../../api/auth.queries';
import { ResetPasswordPage } from './ResetPasswordPage';

vi.mock('../../api/auth.queries', () => ({
  usePasswordReset: vi.fn(),
}));

describe('ResetPasswordPage', () => {
  const passwordReset = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(usePasswordReset).mockReturnValue({
      isPending: false,
      mutateAsync: passwordReset.mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof usePasswordReset>);
  });

  it('should replace the form with confirmation after sending a reset email', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ResetPasswordPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => expect(passwordReset).toHaveBeenCalledWith({ email: 'user@example.com' }));
    expect(screen.getByText('If an account exists for that email, a reset link has been sent.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument();
  });
});
