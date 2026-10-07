import { createParamDecorator, type ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import type { AuthenticatedRequest, AuthUser } from '../../auth/types/auth.types';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.authUser) {
    throw new InternalServerErrorException('Authenticated user is missing from the request');
  }
  return request.authUser;
});
