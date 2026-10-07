import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../AuthProvider';
import { PublicOnly } from './PublicOnly';

vi.mock('../../AuthProvider', () => ({
  useAuth: vi.fn(),
}));

describe('PublicOnly', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should keep an unverified user on a route that completes email sign-up', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      user: { emailVerified: false },
    } as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter>
        <PublicOnly allowUnverifiedUser>
          <div data-test="signup-content" />
        </PublicOnly>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('signup-content')).toBeInTheDocument();
  });
});
