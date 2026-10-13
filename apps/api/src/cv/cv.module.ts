import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../common/config/env.validation';
import { parseEncryptionKey } from '../integrations/crypto/token-cipher';
import { GithubModule } from '../integrations/github/github.module';
import { ProfileModule } from '../profile/profile.module';
import { CV_TOKEN_KEY } from './cv.constants';
import { CvController } from './cv.controller';
import { CvRepository } from './cv.repository';
import { CvService } from './cv.service';
import { PdfRenderer } from './pdf/pdf-renderer.port';
import { PuppeteerPdfRenderer } from './pdf/puppeteer-pdf.renderer';
import { PrismaCvRepository } from './prisma-cv.repository';

@Module({
    imports: [ProfileModule, GithubModule],
    controllers: [CvController],
    providers: [
        CvService,
        { provide: CvRepository, useClass: PrismaCvRepository },
        { provide: PdfRenderer, useClass: PuppeteerPdfRenderer },
        {
            provide: CV_TOKEN_KEY,
            inject: [ConfigService],
            useFactory: (config: ConfigService<EnvironmentVariables, true>): Buffer | null => {
                const encoded = config.get('TOKEN_ENCRYPTION_KEY', { infer: true });
                return encoded ? parseEncryptionKey(encoded) : null;
            },
        },
    ],
    exports: [CvService, PdfRenderer],
})
export class CvModule {}
