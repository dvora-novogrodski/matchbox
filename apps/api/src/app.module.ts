import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { AppConfig } from './app.config';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { validate } from './common/config/env.validation';
import { HealthModule } from './common/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CvModule } from './cv/cv.module';
import { ProfileModule } from './profile/profile.module';
import { StatusesModule } from './statuses/statuses.module';

@Module({
  imports: [
    // Paths are relative to apps/api, where npm workspace scripts run; real env vars take precedence.
    ConfigModule.forRoot({ isGlobal: true, validate, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProfileModule,
    CvModule,
    StatusesModule,
    ApplicationsModule,
  ],
  providers: [
    AppConfig,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
