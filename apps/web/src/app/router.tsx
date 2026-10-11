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
    path: '/pipeline',
    lazy: async () => {
      const { PipelinePage } = await import('src/features/pipeline');
      return {
        Component: () => (
          <RequireAuth>
            <PipelinePage />
          </RequireAuth>
        ),
      };
    },
  },
  {
    path: '/jobs/new',
    lazy: async () => {
      const { AddJobPage } = await import('src/features/job');
      return {
        Component: () => (
          <RequireAuth>
            <AddJobPage />
          </RequireAuth>
        ),
      };
    },
  },
  {
    path: '/jobs/:jobId/:tab?',
    lazy: async () => {
      const { JobPage } = await import('src/features/job');
      return {
        Component: () => (
          <RequireAuth>
            <JobPage />
          </RequireAuth>
        ),
      };
    },
  },
  {
    path: '/cv',
    lazy: async () => {
      const { CvPage } = await import('src/features/cv');
      return {
        Component: () => (
          <RequireAuth>
            <CvPage />
          </RequireAuth>
        ),
      };
    },
  },
  {
    path: '/profile',
    lazy: async () => {
      const { ProfilePage } = await import('src/features/profile');
      return {
        Component: () => (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      };
    },
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
