import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_ROUTE } from '../common/decorators/public.decorator';
import { AuthVerifier } from '../integrations/firebase/auth-verifier.port';
import { UsersService } from '../users/users.service';
import { AuthProviderUnavailableError, AuthTokenVerificationError } from './auth.errors';
import type { AuthenticatedRequest, AuthIdentity } from './types/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authVerifier: AuthVerifier,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request.headers.authorization);
    const identity = await this.verifyToken(token);
    request.authUser = await this.usersService.findOrCreate(identity);
    return true;
  }

  private readBearerToken(authorization: string | undefined): string {
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    if (!match) {
      throw new UnauthorizedException('Bearer token is required');
    }
    return match[1];
  }

  private async verifyToken(token: string): Promise<AuthIdentity> {
    try {
      return await this.authVerifier.verifyIdToken(token);
    } catch (error) {
      if (error instanceof AuthTokenVerificationError) {
        throw new UnauthorizedException('Authentication token is invalid or expired');
      }
      if (error instanceof AuthProviderUnavailableError) {
        throw new ServiceUnavailableException('Authentication service is unavailable');
      }
      throw error;
    }
  }
}
