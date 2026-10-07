export class AuthTokenVerificationError extends Error {
  constructor(cause?: unknown) {
    super('Authentication token verification failed', { cause });
    this.name = AuthTokenVerificationError.name;
  }
}

export class AuthProviderUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Authentication provider is unavailable', { cause });
    this.name = AuthProviderUnavailableError.name;
  }
}
