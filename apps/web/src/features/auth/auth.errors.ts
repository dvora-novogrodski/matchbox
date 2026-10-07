import { FirebaseError } from '@firebase/app';

export type AuthErrorKey =
  | 'errors.emailInUse'
  | 'errors.generic'
  | 'errors.invalidCredentials'
  | 'errors.popupClosed'
  | 'errors.tooManyRequests';

export function toAuthErrorKey(error: unknown): AuthErrorKey {
  if (!(error instanceof FirebaseError)) {
    return 'errors.generic';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'errors.emailInUse';
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-disabled':
      return 'errors.invalidCredentials';
    case 'auth/popup-closed-by-user':
      return 'errors.popupClosed';
    case 'auth/too-many-requests':
      return 'errors.tooManyRequests';
    default:
      return 'errors.generic';
  }
}
