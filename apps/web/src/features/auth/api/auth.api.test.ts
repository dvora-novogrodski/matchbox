import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signUpWithEmail } from './auth.api';

const firebaseMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  sendEmailVerification: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@firebase/auth', () => ({
  createUserWithEmailAndPassword: firebaseMocks.createUserWithEmailAndPassword,
  deleteUser: firebaseMocks.deleteUser,
  GoogleAuthProvider: class GoogleAuthProvider {},
  sendEmailVerification: firebaseMocks.sendEmailVerification,
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: firebaseMocks.signOut,
  updateProfile: firebaseMocks.updateProfile,
}));

vi.mock('src/lib/firebase/firebase', () => ({ firebaseAuth: {} }));

describe('signUpWithEmail', () => {
  const user = { uid: 'firebase-user-1' };

  beforeEach(() => {
    vi.resetAllMocks();
    firebaseMocks.createUserWithEmailAndPassword.mockResolvedValue({ user });
    firebaseMocks.updateProfile.mockResolvedValue(undefined);
    firebaseMocks.sendEmailVerification.mockResolvedValue(undefined);
    firebaseMocks.signOut.mockResolvedValue(undefined);
    firebaseMocks.deleteUser.mockResolvedValue(undefined);
  });

  it('should complete account setup before signing the new user out', async () => {
    await signUpWithEmail('Matchbox User', 'user@example.com', 'password');

    expect(firebaseMocks.updateProfile).toHaveBeenCalledWith(user, { displayName: 'Matchbox User' });
    expect(firebaseMocks.sendEmailVerification).toHaveBeenCalledWith(user);
    expect(firebaseMocks.signOut).toHaveBeenCalledTimes(1);
  });

  it('should remove a partially configured account when setup fails', async () => {
    const error = new Error('verification unavailable');
    firebaseMocks.sendEmailVerification.mockRejectedValue(error);

    await expect(signUpWithEmail('Matchbox User', 'user@example.com', 'password')).rejects.toBe(error);

    expect(firebaseMocks.deleteUser).toHaveBeenCalledWith(user);
  });
});
