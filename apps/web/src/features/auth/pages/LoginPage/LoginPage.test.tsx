import { ThemeProvider } from '@matchbox/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEmailSignIn, useGoogleSignIn } from '../../api/auth.queries';
import { LoginPage } from './LoginPage';

vi.mock('../../api/auth.queries', () => ({
  useEmailSignIn: vi.fn(),
  useGoogleSignIn: vi.fn(),
}));

describe('LoginPage', () => {
  const emailSignIn = vi.fn();
  const googleSignIn = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useEmailSignIn).mockReturnValue({
      isPending: false,
      mutateAsync: emailSignIn,
    } as unknown as ReturnType<typeof useEmailSignIn>);
    vi.mocked(useGoogleSignIn).mockReturnValue({
      isPending: false,
      mutateAsync: googleSignIn,
    } as unknown as ReturnType<typeof useGoogleSignIn>);
  });

  it('should show email and Google sign-in options', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
  });

  it('should show validation errors when required fields are missing', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(emailSignIn).not.toHaveBeenCalled();
  });

  it('should disable both sign-in methods while Google sign-in is pending', () => {
    vi.mocked(useGoogleSignIn).mockReturnValue({
      isPending: true,
      mutateAsync: googleSignIn,
    } as unknown as ReturnType<typeof useGoogleSignIn>);

    renderLoginPage();

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });
});

function renderLoginPage(): void {
  render(
    <ThemeProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}
