import { type ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';

import { type UsersService } from '../users/users.service';
import { AuthProviderUnavailableError, AuthTokenVerificationError } from './auth.errors';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest, AuthIdentity, AuthUser } from './types/auth.types';

const IDENTITY: AuthIdentity = {
  firebaseUid: 'firebase-user-1',
  email: 'user@example.com',
  displayName: 'Matchbox User',
};

const USER: AuthUser = {
  id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd123',
  ...IDENTITY,
};

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const authVerifier = { verifyIdToken: jest.fn() };
  const usersService = { findOrCreate: jest.fn() };
  const guard = new AuthGuard(
    reflector as unknown as Reflector,
    authVerifier,
    usersService as unknown as UsersService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('should allow routes marked as public without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(authVerifier.verifyIdToken).not.toHaveBeenCalled();
  });

  it('should reject requests without a bearer token', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject requests when token verification fails', async () => {
    authVerifier.verifyIdToken.mockRejectedValue(new AuthTokenVerificationError());
    const { context } = createContext('Bearer invalid');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should report an unavailable authentication provider', async () => {
    const providerError = new Error('Authentication provider is unavailable');
    Object.setPrototypeOf(providerError, AuthProviderUnavailableError.prototype);
    authVerifier.verifyIdToken.mockRejectedValue(providerError);
    const { context } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should attach the provisioned user when the token is valid', async () => {
    authVerifier.verifyIdToken.mockResolvedValue(IDENTITY);
    usersService.findOrCreate.mockResolvedValue(USER);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(usersService.findOrCreate).toHaveBeenCalledWith(IDENTITY);
    expect(request.authUser).toEqual(USER);
  });
});

function createContext(authorization?: string): {
  context: ExecutionContext;
  request: AuthenticatedRequest;
} {
  const request: AuthenticatedRequest = {
    headers: authorization ? { authorization } : {},
  };
  const context = {
    getClass: () => AuthGuard,
    getHandler: () => createContext,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}
