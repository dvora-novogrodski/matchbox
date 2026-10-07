import { Injectable } from '@nestjs/common';

import type { AuthIdentity, AuthUser } from '../auth/types/auth.types';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersRepository } from './users.repository';

const USER_SELECT = {
  id: true,
  firebaseUid: true,
  email: true,
  displayName: true,
} as const;

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findOrCreate(identity: AuthIdentity): Promise<AuthUser> {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: identity.firebaseUid },
      select: USER_SELECT,
    });
    if (existing && existing.email === identity.email && existing.displayName === identity.displayName) {
      return existing;
    }

    return this.prisma.user.upsert({
      where: { firebaseUid: identity.firebaseUid },
      create: identity,
      update: {
        email: identity.email,
        displayName: identity.displayName,
      },
      select: USER_SELECT,
    });
  }
}
