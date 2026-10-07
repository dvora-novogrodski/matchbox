import type { AuthIdentity, AuthUser } from '../auth/types/auth.types';

export abstract class UsersRepository {
  abstract findOrCreate(identity: AuthIdentity): Promise<AuthUser>;
}
