import { Module } from '@nestjs/common';

import { AuthVerifier } from './auth-verifier.port';
import { FirebaseAuthVerifier } from './firebase-auth-verifier';

@Module({
  providers: [{ provide: AuthVerifier, useClass: FirebaseAuthVerifier }],
  exports: [AuthVerifier],
})
export class FirebaseModule {}
