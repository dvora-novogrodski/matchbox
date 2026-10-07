import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from './auth.api';
import { getCurrentUser } from './users.api';

export const authKeys = {
  currentUser: ['auth', 'current-user'] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: getCurrentUser,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => queryClient.clear(),
  });
}

export function useEmailSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signInWithEmail(email, password),
  });
}

export function useGoogleSignIn() {
  return useMutation({ mutationFn: signInWithGoogle });
}

export function useEmailSignUp() {
  return useMutation({
    mutationFn: ({ displayName, email, password }: { displayName: string; email: string; password: string }) =>
      signUpWithEmail(displayName, email, password),
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => requestPasswordReset(email),
  });
}
