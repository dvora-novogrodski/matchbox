import type { AuthIdentity } from '../../auth/types/auth.types';

export abstract class AuthVerifier {
  abstract verifyIdToken(token: string): Promise<AuthIdentity>;
}
