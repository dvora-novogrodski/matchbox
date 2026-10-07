import { ThemeProvider } from '@matchbox/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import { useCurrentUser, useSignOut } from 'src/features/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('src/features/auth', () => ({
  useCurrentUser: vi.fn(),
  useSignOut: vi.fn(),
}));

describe('App', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSignOut).mockReturnValue({
      isError: false,
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useSignOut>);
  });

  it('should show the authenticated user', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123', email: 'user@example.com', displayName: null },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Matchbox' })).toBeInTheDocument();
    expect(screen.getByText('Signed in as user@example.com')).toBeInTheDocument();
  });

  it('should sign out when the user selects sign out', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123', email: 'user@example.com', displayName: null },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('should show an error when sign out fails', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123', email: 'user@example.com', displayName: null },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useCurrentUser>);
    vi.mocked(useSignOut).mockReturnValue({
      isError: true,
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useSignOut>);

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(screen.getByText('You could not be signed out. Please try again.')).toBeInTheDocument();
  });
});
