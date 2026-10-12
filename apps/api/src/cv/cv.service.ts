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
import { GitHubClient, type GitHubCommitFile } from '../integrations/github/github-client.port';
import { ProfileService } from '../profile/profile.service';
import { catalogFromProfile, composeCvDocument, countRemovedIds, pruneSelection, selectionFromProfile } from './compose-base-cv';
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
        const [record, profile] = await Promise.all([this.requireUser(userId), this.profileService.getProfile(userId)]);
        const stored = BaseCvSchema.safeParse(record.baseCv);
        const cleaned = this.withoutStaleIds(profile, selection, stored.success ? stored.data : null);
        await this.cvRepository.saveBaseCv(userId, cleaned);
        this.logger.log({ userId, experienceCount: cleaned.experienceItemIds.length }, 'Base CV saved');
        return this.getEditor(userId);
    }

    async renderPdf(userId: string): Promise<Buffer> {
        const editor = await this.getEditor(userId);
        return this.pdfRenderer.renderHtml(editor.html);
    }

    async saveBaseVersion(userId: string): Promise<CvVersion> {
        const editor = await this.getEditor(userId);
        const record = await this.requireUser(userId);
        const commitSha = await this.commitFiles(userId, record, BASE_CV_COMMIT_MESSAGE, [
            { path: BASE_CV_JSON_PATH, content: `${JSON.stringify(editor.document, null, 2)}\n` },
            { path: BASE_CV_HTML_PATH, content: editor.html },
        ]);
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
            removedItemCount: stored.success ? countRemovedIds(profile, stored.data) : 0,
            github: {
                repo: record.githubRepo,
                connected: Boolean(record.githubRepo && record.githubTokenEncrypted),
            },
            templateId: DEFAULT_CV_TEMPLATE_ID,
        };
    }

    async commitDocument(userId: string, message: string, files: GitHubCommitFile[]): Promise<string | null> {
        const record = await this.requireUser(userId);
        return this.commitFiles(userId, record, message, files);
    }

    private async commitFiles(
        userId: string,
        record: UserCvRecord,
        message: string,
        files: GitHubCommitFile[],
    ): Promise<string | null> {
        const access = this.githubAccess(userId, record);
        if (!access) {
            return null;
        }
        return this.githubClient.commitFiles({
            repo: access.repo,
            token: access.token,
            message,
            files,
        });
    }

    /** Null when GitHub is not connected or the path has no commit. */
    async findCommitForPath(userId: string, path: string): Promise<string | null> {
        const record = await this.requireUser(userId);
        const access = this.githubAccess(userId, record);
        if (!access) {
            return null;
        }
        return this.githubClient.findCommitByPath({ repo: access.repo, token: access.token, path });
    }

    private githubAccess(userId: string, record: UserCvRecord): { repo: string; token: string } | null {
        if (!record.githubRepo || !record.githubTokenEncrypted) {
            return null;
        }
        if (!this.encryptionKey) {
            throw new TokenEncryptionUnavailableError();
        }
        try {
            return { repo: record.githubRepo, token: decryptToken(record.githubTokenEncrypted, this.encryptionKey) };
        } catch (error) {
            this.logger.warn({ userId, err: error }, 'Stored GitHub token could not be decrypted');
            throw new CvGithubCredentialsError();
        }
    }

    private withoutStaleIds(profile: Profile, selection: BaseCv, previous: BaseCv | null): BaseCv {
        return {
            ...selection,
            experienceItemIds: this.resolveIds(
                selection.experienceItemIds,
                profile.experience.map((item) => item.id),
                previous?.experienceItemIds ?? [],
            ),
            projectItemIds: this.resolveIds(
                selection.projectItemIds,
                profile.projects.map((item) => item.id),
                previous?.projectItemIds ?? [],
            ),
            skillIds: this.resolveIds(
                selection.skillIds,
                profile.skills.map((skill) => skill.id),
                previous?.skillIds ?? [],
            ),
            educationItemIds: this.resolveIds(
                selection.educationItemIds,
                profile.education.map((item) => item.id),
                previous?.educationItemIds ?? [],
            ),
        };
    }

    private resolveIds(ids: string[], owned: string[], previouslyStored: string[]): string[] {
        const ownedSet = new Set(owned);
        const previousSet = new Set(previouslyStored);
        const seen = new Set<string>();
        const kept: string[] = [];
        for (const id of ids) {
            if (seen.has(id)) {
                throw new BadRequestException('Each career item can appear only once');
            }
            seen.add(id);
            if (ownedSet.has(id)) {
                kept.push(id);
                continue;
            }
            if (previousSet.has(id)) {
                continue;
            }
            throw new CvItemNotFoundError(id);
        }
        return kept;
    }

    private async requireUser(userId: string): Promise<UserCvRecord> {
        const record = await this.cvRepository.findUserCvRecord(userId);
        if (!record) {
            throw new CvUserNotFoundError();
        }
        return record;
    }
}
