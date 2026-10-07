import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, FirebaseAuthError, getAuth } from 'firebase-admin/auth';

import { AuthProviderUnavailableError, AuthTokenVerificationError } from '../../auth/auth.errors';
import type { AuthIdentity } from '../../auth/types/auth.types';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { AuthVerifier } from './auth-verifier.port';

const FIREBASE_APP_NAME = 'matchbox-api';
const INVALID_TOKEN_ERROR_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
  'auth/mismatching-tenant-id',
]);

@Injectable()
export class FirebaseAuthVerifier extends AuthVerifier {
  private readonly auth: Auth;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super();
    const app =
      getApps().find((candidate) => candidate.name === FIREBASE_APP_NAME) ??
      initializeApp(
        {
          credential: applicationDefault(),
          projectId: config.get('FIREBASE_PROJECT_ID', { infer: true }),
        },
        FIREBASE_APP_NAME,
      );
    this.auth = getAuth(app);
  }

  async verifyIdToken(token: string): Promise<AuthIdentity> {
    try {
      const decoded = await this.auth.verifyIdToken(token);
      if (!decoded.email) {
        throw new AuthTokenVerificationError();
      }

      return {
        firebaseUid: decoded.uid,
        email: decoded.email,
        displayName: typeof decoded.name === 'string' ? decoded.name : null,
      };
    } catch (error) {
      if (error instanceof AuthTokenVerificationError) {
        throw error;
      }
      if (error instanceof FirebaseAuthError && INVALID_TOKEN_ERROR_CODES.has(error.code)) {
        throw new AuthTokenVerificationError(error);
      }
      throw new AuthProviderUnavailableError(error);
    }
  }
}
