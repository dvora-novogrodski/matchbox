import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './common/config/env.validation';
import { HealthModule } from './common/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    // Paths are relative to apps/api, where npm workspace scripts run; real env vars take precedence.
    ConfigModule.forRoot({ isGlobal: true, validate, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
