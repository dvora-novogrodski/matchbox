import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage, PublicOnly, RequireAuth, ResetPasswordPage, SignUpPage } from 'src/features/auth';

import { AuthenticatedLayout } from './AuthenticatedLayout';

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <AuthenticatedLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate replace to="/today" /> },
      {
        path: 'today',
        lazy: async () => {
          const { TodayPage } = await import('src/features/today');
          return { Component: TodayPage };
        },
      },
      {
        path: 'discover',
        lazy: async () => {
          const { DiscoverPage } = await import('src/features/discover');
          return { Component: DiscoverPage };
        },
      },
      {
        path: 'pipeline',
        lazy: async () => {
          const { PipelinePage } = await import('src/features/pipeline');
          return { Component: PipelinePage };
        },
      },
      {
        path: 'jobs/new',
        lazy: async () => {
          const { AddJobPage } = await import('src/features/job');
          return { Component: AddJobPage };
        },
      },
      {
        path: 'jobs/:jobId/:tab?',
        lazy: async () => {
          const { JobPage } = await import('src/features/job');
          return { Component: JobPage };
        },
      },
      {
        path: 'cv',
        lazy: async () => {
          const { CvPage } = await import('src/features/cv');
          return { Component: CvPage };
        },
      },
      {
        path: 'profile',
        lazy: async () => {
          const { ProfilePage } = await import('src/features/profile');
          return { Component: ProfilePage };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsPage } = await import('src/features/settings');
          return { Component: SettingsPage };
        },
      },
    ],
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
