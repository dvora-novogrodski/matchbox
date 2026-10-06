import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import type { EnvironmentVariables } from './common/config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const port = config.get('API_PORT', { infer: true });
  const webOrigins = config.get('WEB_ORIGIN', { infer: true });
  app.enableShutdownHooks();
  app.enableCors({ origin: webOrigins });
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
