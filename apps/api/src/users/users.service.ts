import { Injectable } from '@nestjs/common';

import type { AuthIdentity, AuthUser } from '../auth/types/auth.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findOrCreate(identity: AuthIdentity): Promise<AuthUser> {
    return this.usersRepository.findOrCreate(identity);
  }
}
