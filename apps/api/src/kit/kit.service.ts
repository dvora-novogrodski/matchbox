import { type ApplicationKit, CvDocumentSchema, DEFAULT_CV_TEMPLATE_ID, type UpdateApplicationKit } from '@matchbox/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { CvService } from '../cv/cv.service';
import { PdfRenderer } from '../cv/pdf/pdf-renderer.port';
import { renderCvHtml } from '../cv/templates/render-cv-html';
import { KitNotFoundError } from './kit.errors';
import { toApplicationKit, toStoredKit } from './kit.mapper';
import { KitRepository } from './kit.repository';
import type { KitRecord } from './types/kit.types';

@Injectable()
export class KitService {
    private readonly logger = new Logger(KitService.name);

    constructor(
        private readonly kitRepository: KitRepository,
        @Inject(CvService) private readonly cvService: Pick<CvService, 'renderPdf'>,
        private readonly pdfRenderer: PdfRenderer,
    ) {}

    async get(userId: string, applicationId: string): Promise<ApplicationKit> {
        const record = await this.requireRecord(userId, applicationId);
        return this.readKit(userId, applicationId, record.kit);
    }

    async update(userId: string, applicationId: string, kit: UpdateApplicationKit): Promise<ApplicationKit> {
        const stored = toStoredKit(kit);
        const saved = await this.kitRepository.save(userId, applicationId, stored);
        if (!saved) {
            throw new KitNotFoundError(applicationId);
        }
        this.logger.log({ userId, applicationId }, 'Application kit saved');
        return { ...stored, saved: true };
    }

    async renderPdf(userId: string, applicationId: string): Promise<Buffer> {
        const record = await this.requireRecord(userId, applicationId);
        const document = CvDocumentSchema.safeParse(record.cv);
        if (document.success) {
            return this.pdfRenderer.renderHtml(renderCvHtml(document.data, DEFAULT_CV_TEMPLATE_ID));
        }
        if (record.cv !== null) {
            this.logger.warn({ userId, applicationId }, 'Saved job CV was ignored because it did not match the schema');
        }
        return this.cvService.renderPdf(userId);
    }

    private async requireRecord(userId: string, applicationId: string): Promise<KitRecord> {
        const record = await this.kitRepository.find(userId, applicationId);
        if (!record) {
            throw new KitNotFoundError(applicationId);
        }
        return record;
    }

    private readKit(userId: string, applicationId: string, kit: unknown): ApplicationKit {
        const parsed = toApplicationKit(kit);
        if (kit !== null && kit !== undefined && !parsed.saved) {
            this.logger.warn({ userId, applicationId }, 'Stored application kit was ignored because it did not match the schema');
        }
        return parsed;
    }
}
