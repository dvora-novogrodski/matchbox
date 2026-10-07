import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { FirebaseModule } from '../integrations/firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [FirebaseModule, UsersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
