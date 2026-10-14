import { ThemeProvider } from '@matchbox/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createQueryClient } from 'src/app/query-client';
import { AppShell } from 'src/components/AppShell';
import { useCurrentUser, useSignOut } from 'src/features/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/features/auth', () => ({
  useCurrentUser: vi.fn(),
  useSignOut: vi.fn(),
}));

vi.mock('src/features/today/api/today.queries', () => ({
  useToday: () => ({
    data: { stats: { matches: 0, toTailor: 0, followUps: 0, inProgress: 0 } },
    isError: false,
    isPending: false,
  }),
}));

function renderShell() {
  const queryClient = createQueryClient();
  const pageContent = 'Page content';
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/today']}>
          <Routes>
            <Route element={<AppShell />} path="/">
              <Route element={<div>{pageContent}</div>} path="today" />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSignOut).mockReturnValue({
      isError: false,
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useSignOut>);
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123', email: 'user@example.com', displayName: 'Dvora' },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useCurrentUser>);
  });

  it('should show navigation and the add job action', () => {
    renderShell();

    expect(screen.getByTestId('app-shell-logo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add job' })).toHaveAttribute('href', '/jobs/new');
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should sign out from the account menu', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('should show the empty notification state', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByRole('menuitem', { name: 'No new notifications' })).toBeInTheDocument();
  });

  it('should open a navigation panel from the keyboard', async () => {
    renderShell();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Pipeline menu' }), { key: 'ArrowDown' });

    expect(await screen.findByRole('menuitem', { name: /Board/ })).toHaveAttribute('href', '/pipeline?view=board');
    expect(screen.getByRole('menuitem', { name: /Needs follow-up/ })).toHaveAttribute(
      'href',
      '/pipeline?view=board&filter=follow-up',
    );
  });
});
