import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../common/config/env.validation';
import { AiClient } from './ai-client.port';
import { HttpAiClient } from './http-ai.client';

@Module({
    providers: [
        {
            provide: AiClient,
            inject: [ConfigService],
            useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
                new HttpAiClient(config.get('AI_SERVICE_URL', { infer: true }), config.get('AI_TIMEOUT_MS', { infer: true })),
        },
    ],
    exports: [AiClient],
})
export class AiModule {}
