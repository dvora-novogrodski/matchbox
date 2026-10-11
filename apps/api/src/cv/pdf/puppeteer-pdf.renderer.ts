import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-core';

import type { EnvironmentVariables } from '../../common/config/env.validation';
import { CvPdfUnavailableError } from '../cv.errors';
import { PdfRenderer } from './pdf-renderer.port';

@Injectable()
export class PuppeteerPdfRenderer extends PdfRenderer {
    private readonly logger = new Logger(PuppeteerPdfRenderer.name);

    constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {
        super();
    }

    async renderHtml(html: string): Promise<Buffer> {
        const executablePath = this.config.get('CHROME_PATH', { infer: true });
        if (!executablePath) {
            throw new CvPdfUnavailableError();
        }

        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
        try {
            browser = await puppeteer.launch({
                executablePath,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'load', timeout: 15_000 });
            const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
            return Buffer.from(pdf);
        } catch (error) {
            if (error instanceof CvPdfUnavailableError) {
                throw error;
            }
            this.logger.error({ err: error }, 'CV PDF render failed');
            throw new CvPdfUnavailableError(error);
        } finally {
            await browser?.close();
        }
    }
}
