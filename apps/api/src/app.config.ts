import { Injectable, RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';

import type { EnvironmentVariables } from './common/config/env.validation';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  configure(app: NestFastifyApplication): void {
    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.enableCors({
      origin: this.config.get('WEB_ORIGIN', { infer: true }),
      methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.enableShutdownHooks();
  }
}
