import { createBrowserRouter } from 'react-router-dom';
import { LoginPage, PublicOnly, RequireAuth, ResetPasswordPage, SignUpPage } from 'src/features/auth';

import { App } from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicOnly allowUnverifiedUser>
        <SignUpPage />
      </PublicOnly>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicOnly>
        <ResetPasswordPage />
      </PublicOnly>
    ),
  },
]);
