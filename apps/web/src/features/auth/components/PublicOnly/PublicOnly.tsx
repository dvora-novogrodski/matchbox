import { Box, CircularProgress } from '@matchbox/ui';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../AuthProvider';

type PublicOnlyProps = {
  children: ReactNode;
  allowUnverifiedUser?: boolean;
};

export function PublicOnly({ allowUnverifiedUser = false, children }: PublicOnlyProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box data-test="auth-session-loading" sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const shouldRedirect = user && (!allowUnverifiedUser || user.emailVerified);
  return shouldRedirect ? <Navigate replace to="/today" /> : children;
}
