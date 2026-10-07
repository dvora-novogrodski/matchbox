import { ThemeProvider } from '@matchbox/ui';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEmailSignUp, useGoogleSignIn } from '../../api/auth.queries';
import { SignUpPage } from './SignUpPage';

vi.mock('../../api/auth.queries', () => ({
  useEmailSignUp: vi.fn(),
  useGoogleSignIn: vi.fn(),
}));

describe('SignUpPage', () => {
  const emailSignUp = vi.fn();
  const googleSignIn = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useEmailSignUp).mockReturnValue({
      isPending: false,
      mutateAsync: emailSignUp,
    } as unknown as ReturnType<typeof useEmailSignUp>);
    vi.mocked(useGoogleSignIn).mockReturnValue({
      isPending: false,
      mutateAsync: googleSignIn.mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useGoogleSignIn>);
  });

  it('should offer Google sign-up', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <SignUpPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => expect(googleSignIn).toHaveBeenCalledTimes(1));
  });

  it('should disable both sign-up methods while Google sign-up is pending', () => {
    vi.mocked(useGoogleSignIn).mockReturnValue({
      isPending: true,
      mutateAsync: googleSignIn,
    } as unknown as ReturnType<typeof useGoogleSignIn>);

    render(
      <ThemeProvider>
        <MemoryRouter>
          <SignUpPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });
});
