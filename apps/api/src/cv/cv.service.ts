import {
    type BaseCv,
    BaseCvSchema,
    type ConnectGithub,
    type CvEditor,
    type CvVersion,
    DEFAULT_CV_TEMPLATE_ID,
    type GithubConnection,
    type Profile,
} from '@matchbox/shared';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';

import { decryptToken, encryptToken } from '../integrations/crypto/token-cipher';
import { GitHubClient } from '../integrations/github/github-client.port';
import { ProfileService } from '../profile/profile.service';
import { catalogFromProfile, composeCvDocument, pruneSelection, selectionFromProfile } from './compose-base-cv';
import { BASE_CV_COMMIT_MESSAGE, BASE_CV_HTML_PATH, BASE_CV_JSON_PATH, CV_TOKEN_KEY } from './cv.constants';
import { CvGithubCredentialsError, CvItemNotFoundError, CvUserNotFoundError, TokenEncryptionUnavailableError } from './cv.errors';
import { toCvVersion } from './cv.mapper';
import { CvRepository } from './cv.repository';
import { PdfRenderer } from './pdf/pdf-renderer.port';
import { renderCvHtml } from './templates/render-cv-html';
import type { UserCvRecord } from './types/cv.types';

@Injectable()
export class CvService {
    private readonly logger = new Logger(CvService.name);

    constructor(
        private readonly cvRepository: CvRepository,
        private readonly profileService: ProfileService,
        private readonly githubClient: GitHubClient,
        private readonly pdfRenderer: PdfRenderer,
        @Inject(CV_TOKEN_KEY) private readonly encryptionKey: Buffer | null,
    ) {}

    async getEditor(userId: string): Promise<CvEditor> {
        const [record, profile, latestVersion] = await Promise.all([
            this.requireUser(userId),
            this.profileService.getProfile(userId),
            this.cvRepository.findLatestBaseVersion(userId),
        ]);
        return this.toEditor(userId, record, profile, latestVersion);
    }

    async saveBaseCv(userId: string, selection: BaseCv): Promise<CvEditor> {
        const profile = await this.profileService.getProfile(userId);
        this.assertOwned(profile, selection);
        await this.cvRepository.saveBaseCv(userId, selection);
        this.logger.log({ userId, experienceCount: selection.experienceItemIds.length }, 'Base CV saved');
        return this.getEditor(userId);
    }

    async renderPdf(userId: string): Promise<Buffer> {
        const editor = await this.getEditor(userId);
        return this.pdfRenderer.renderHtml(editor.html);
    }

    async saveBaseVersion(userId: string): Promise<CvVersion> {
        const editor = await this.getEditor(userId);
        const record = await this.requireUser(userId);
        const commitSha = await this.commitBaseCv(userId, record, editor);
        const stored = await this.cvRepository.createBaseVersion(userId, {
            document: editor.document,
            selection: editor.selection,
            templateId: DEFAULT_CV_TEMPLATE_ID,
            gitPath: BASE_CV_JSON_PATH,
            commitSha,
        });
        this.logger.log({ userId, versionId: stored.id, committed: commitSha !== null }, 'Base CV version saved');
        return toCvVersion(stored);
    }

    async connectGithub(userId: string, input: ConnectGithub): Promise<GithubConnection> {
        if (!this.encryptionKey) {
            throw new TokenEncryptionUnavailableError();
        }
        await this.requireUser(userId);
        const tokenEncrypted = encryptToken(input.token, this.encryptionKey);
        await this.cvRepository.saveGithubCredentials(userId, input.repo, tokenEncrypted);
        this.logger.log({ userId, repo: input.repo }, 'GitHub repository connected');
        return { repo: input.repo, connected: true };
    }

    async disconnectGithub(userId: string): Promise<void> {
        await this.cvRepository.clearGithubCredentials(userId);
        this.logger.log({ userId }, 'GitHub repository disconnected');
    }

    private toEditor(
        userId: string,
        record: UserCvRecord,
        profile: Profile,
        latestVersion: Awaited<ReturnType<CvRepository['findLatestBaseVersion']>>,
    ): CvEditor {
        const stored = BaseCvSchema.safeParse(record.baseCv);
        if (record.baseCv !== null && record.baseCv !== undefined && !stored.success) {
            this.logger.warn({ userId }, 'Stored base CV was ignored because it did not match the schema');
        }
        const selection = stored.success
            ? pruneSelection(profile, stored.data)
            : selectionFromProfile(profile, record);
        const document = composeCvDocument(profile, selection);
        return {
            selection,
            document,
            html: renderCvHtml(document, DEFAULT_CV_TEMPLATE_ID),
            isCustomized: stored.success,
            catalog: catalogFromProfile(profile),
            latestVersion: latestVersion ? toCvVersion(latestVersion) : null,
            github: {
                repo: record.githubRepo,
                connected: Boolean(record.githubRepo && record.githubTokenEncrypted),
            },
            templateId: DEFAULT_CV_TEMPLATE_ID,
        };
    }

    private async commitBaseCv(userId: string, record: UserCvRecord, editor: CvEditor): Promise<string | null> {
        if (!record.githubRepo || !record.githubTokenEncrypted) {
            return null;
        }
        if (!this.encryptionKey) {
            throw new TokenEncryptionUnavailableError();
        }
        let token: string;
        try {
            token = decryptToken(record.githubTokenEncrypted, this.encryptionKey);
        } catch (error) {
            this.logger.warn({ userId, err: error }, 'Stored GitHub token could not be decrypted');
            throw new CvGithubCredentialsError();
        }
        return this.githubClient.commitFiles({
            repo: record.githubRepo,
            token,
            message: BASE_CV_COMMIT_MESSAGE,
            files: [
                { path: BASE_CV_JSON_PATH, content: `${JSON.stringify(editor.document, null, 2)}\n` },
                { path: BASE_CV_HTML_PATH, content: editor.html },
            ],
        });
    }

    private assertOwned(profile: Profile, selection: BaseCv): void {
        this.assertIds(selection.experienceItemIds, profile.experience.map((item) => item.id));
        this.assertIds(selection.projectItemIds, profile.projects.map((item) => item.id));
        this.assertIds(selection.skillIds, profile.skills.map((skill) => skill.id));
        this.assertIds(selection.educationItemIds, profile.education.map((item) => item.id));
    }

    private assertIds(ids: string[], allowed: string[]): void {
        const allowedSet = new Set(allowed);
        const seen = new Set<string>();
        for (const id of ids) {
            if (seen.has(id)) {
                throw new BadRequestException('Each career item can appear only once');
            }
            seen.add(id);
            if (!allowedSet.has(id)) {
                throw new CvItemNotFoundError(id);
            }
        }
    }

    private async requireUser(userId: string): Promise<UserCvRecord> {
        const record = await this.cvRepository.findUserCvRecord(userId);
        if (!record) {
            throw new CvUserNotFoundError();
        }
        return record;
    }
}
