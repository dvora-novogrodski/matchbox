import { Module } from '@nestjs/common';

import { PrismaUsersRepository } from './prisma-users.repository';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, { provide: UsersRepository, useClass: PrismaUsersRepository }],
  exports: [UsersService],
})
export class UsersModule {}
