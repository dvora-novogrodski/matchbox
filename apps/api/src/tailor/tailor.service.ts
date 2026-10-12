import { type CvChange, type CvDocument, type DecideCvChange, DEFAULT_CV_TEMPLATE_ID, type Profile, type SavedJobCv, type TailorResult } from '@matchbox/shared';
import { Injectable, Logger } from '@nestjs/common';

import { CvService } from '../cv/cv.service';
import { renderCvHtml } from '../cv/templates/render-cv-html';
import { AiClient } from '../integrations/ai/ai-client.port';
import { ProfileService } from '../profile/profile.service';
import { applyCvChanges, CvChangeApplyError } from './apply-cv-changes';
import { jobCvPaths } from './job-cv-path';
import { reviewCvChange } from './review-cv-change';
import {
    BlockedCvChangeError,
    CvChangeApplyFailedError,
    CvChangeNotFoundError,
    DraftAlreadyClosedError,
    NothingToSaveError,
    TailorApplicationNotFoundError,
} from './tailor.errors';
import { evidenceFromProfile, isOpenDraft, readCvDocument, readRequirements, toCvChange, toSavedJobCv } from './tailor.mapper';
import { type StoredCvChange, TailorRepository } from './tailor.repository';

const MAX_PROPOSALS = 20;
export const SAVING_STALE_AFTER_MS = 5 * 60 * 1000;

type PreparedSave = {
    next: CvDocument;
    jsonPath: string;
    htmlPath: string;
    commitSha: string | null;
};

@Injectable()
export class TailorService {
    private readonly logger = new Logger(TailorService.name);

    constructor(
        private readonly tailorRepository: TailorRepository,
        private readonly cvService: CvService,
        private readonly profileService: ProfileService,
        private readonly aiClient: AiClient,
    ) {}

    async list(userId: string, applicationId: string): Promise<TailorResult> {
        const application = await this.tailorRepository.findApplication(userId, applicationId);
        if (!application) {
            throw new TailorApplicationNotFoundError(applicationId);
        }
        const [changes, profile] = await Promise.all([
            this.tailorRepository.listOpenChanges(userId, applicationId),
            this.profileService.getProfile(userId),
        ]);
        return { changes: changes.map((change) => toCvChange(change, labelsFrom(profile))) };
    }

    async tailor(userId: string, applicationId: string): Promise<TailorResult> {
        const application = await this.tailorRepository.findApplication(userId, applicationId);
        if (!application) {
            throw new TailorApplicationNotFoundError(applicationId);
        }
        const profile = await this.profileService.getProfile(userId);
        const source = await this.resolveSource(userId, applicationId);
        const evidence = evidenceFromProfile(profile);
        const output = await this.aiClient.tailor({
            job: {
                title: application.title,
                companyName: application.companyName,
                description: application.description,
                requirements: readRequirements(application.requirements),
            },
            cv: source.document,
            evidence: evidence.map(({ id, label, text }) => ({ id, label, text })),
        });
        const ownedIds = new Set(evidence.map((item) => item.id));
        const careerItemIds = new Set(evidence.filter((item) => item.careerItem).map((item) => item.id));
        const skillNames = new Set(profile.skills.map((skill) => skill.name));
        const reviewed = output.changes.slice(0, MAX_PROPOSALS).map((change) => {
            const result = reviewCvChange(change, { document: source.document, ownedIds, skillNames });
            const evidenceItemId = result.evidenceIds.find((id) => careerItemIds.has(id)) ?? null;
            return {
                ...result,
                evidenceItemId,
                model: output.model,
                promptVersion: output.promptVersion,
                runId: output.runId,
            };
        });
        const stored = await this.tailorRepository.saveProposals(userId, {
            applicationId,
            openDraftId: source.openDraftId,
            parentId: source.parentId,
            document: source.document,
            changes: reviewed,
        });
        this.logger.log(
            { userId, applicationId, changeCount: stored.length, blockedCount: stored.filter((change) => change.state === 'blocked').length },
            'CV proposals stored',
        );
        const labels = labelsFrom(profile);
        return { changes: stored.map((change) => toCvChange(change, labels)) };
    }

    async decide(userId: string, applicationId: string, changeId: string, input: DecideCvChange): Promise<CvChange> {
        const current = await this.requireOpenChange(userId, applicationId, changeId);
        if (current.state === 'blocked') {
            throw new BlockedCvChangeError();
        }
        const updated = await this.tailorRepository.decide(userId, changeId, input.decision, new Date());
        if (!updated) {
            throw new CvChangeNotFoundError(changeId);
        }
        const profile = await this.profileService.getProfile(userId);
        return toCvChange(updated, labelsFrom(profile));
    }

    async save(userId: string, applicationId: string): Promise<SavedJobCv> {
        const application = await this.tailorRepository.findApplication(userId, applicationId);
        if (!application) {
            throw new TailorApplicationNotFoundError(applicationId);
        }
        const latest = await this.tailorRepository.findLatestVersion(userId, applicationId);
        if (!latest) {
            throw new NothingToSaveError();
        }
        const now = new Date();
        const gitPath = latest.gitPath ?? jobCvPaths(application.companyName, application.title, now).jsonPath;
        if (latest.status === 'saving') {
            if (!isStaleSaving(latest.savingStartedAt, now)) {
                throw new DraftAlreadyClosedError();
            }
            const reclaimed = await this.tailorRepository.reclaimStaleDraft(
                userId,
                latest.id,
                gitPath,
                now,
                new Date(now.getTime() - SAVING_STALE_AFTER_MS),
            );
            if (!reclaimed) {
                throw new DraftAlreadyClosedError();
            }
            return this.finishReclaimedDraft(userId, applicationId, application, latest, gitPath);
        }
        if (!isOpenDraft(latest)) {
            throw new DraftAlreadyClosedError();
        }
        const claimed = await this.tailorRepository.claimDraft(userId, latest.id, gitPath, now);
        if (!claimed) {
            throw new DraftAlreadyClosedError();
        }
        return this.finishClaimedDraft(userId, applicationId, application, latest, gitPath);
    }

    private async requireOpenChange(userId: string, applicationId: string, changeId: string): Promise<StoredCvChange> {
        const change = await this.tailorRepository.findChange(userId, applicationId, changeId);
        if (!change || !change.draftOpen) {
            throw new CvChangeNotFoundError(changeId);
        }
        return change;
    }

    private applyAccepted(source: CvDocument, accepted: StoredCvChange[]): CvDocument {
        try {
            return applyCvChanges(
                source,
                accepted.map((change) => ({ path: change.path, op: change.op, after: change.after })),
            );
        } catch (error) {
            if (error instanceof CvChangeApplyError) {
                throw new CvChangeApplyFailedError();
            }
            throw error;
        }
    }

    private async finishReclaimedDraft(
        userId: string,
        applicationId: string,
        application: { companyName: string; title: string },
        latest: { id: string; cv: unknown; savingStartedAt: Date | null },
        gitPath: string,
    ): Promise<SavedJobCv> {
        let existingSha: string | null;
        try {
            existingSha = await this.cvService.findCommitForPath(userId, gitPath);
        } catch (error) {
            await this.restoreClaim(userId, applicationId, latest.id, latest.savingStartedAt);
            throw error;
        }
        if (existingSha !== null) {
            try {
                const prepared = await this.prepareDocument(userId, latest);
                return await this.recordSaved(userId, applicationId, latest.id, {
                    next: prepared.next,
                    jsonPath: gitPath,
                    htmlPath: gitPath.replace(/\.json$/, '.html'),
                    commitSha: existingSha,
                });
            } catch (error) {
                if (!(error instanceof DraftAlreadyClosedError)) {
                    await this.restoreClaim(userId, applicationId, latest.id, latest.savingStartedAt);
                }
                throw error;
            }
        }
        return this.finishClaimedDraft(userId, applicationId, application, latest, gitPath);
    }

    private async finishClaimedDraft(
        userId: string,
        applicationId: string,
        application: { companyName: string; title: string },
        latest: { id: string; cv: unknown },
        gitPath: string,
    ): Promise<SavedJobCv> {
        let prepared: PreparedSave;
        try {
            const document = await this.prepareDocument(userId, latest);
            const htmlPath = gitPath.replace(/\.json$/, '.html');
            const html = renderCvHtml(document.next, DEFAULT_CV_TEMPLATE_ID);
            const commitSha = await this.cvService.commitDocument(userId, `Save CV for ${application.companyName} ${application.title}`, [
                { path: gitPath, content: `${JSON.stringify(document.next, null, 2)}\n` },
                { path: htmlPath, content: html },
            ]);
            prepared = { next: document.next, jsonPath: gitPath, htmlPath, commitSha };
        } catch (error) {
            await this.reopenDraft(userId, applicationId, latest.id);
            throw error;
        }
        return this.recordSaved(userId, applicationId, latest.id, prepared);
    }

    private async prepareDocument(userId: string, latest: { id: string; cv: unknown }): Promise<{ next: CvDocument }> {
        const changes = await this.tailorRepository.listVersionChanges(userId, latest.id);
        const accepted = changes.filter((change) => change.state === 'accepted');
        if (accepted.length === 0) {
            throw new NothingToSaveError();
        }
        const source = readCvDocument(latest.cv);
        if (!source) {
            throw new CvChangeApplyFailedError();
        }
        return { next: this.applyAccepted(source, accepted) };
    }

    private async recordSaved(userId: string, applicationId: string, versionId: string, prepared: PreparedSave): Promise<SavedJobCv> {
        const saved = await this.tailorRepository.finalizeDraft(userId, versionId, prepared.next, prepared.jsonPath, prepared.commitSha);
        if (!saved) {
            this.logger.error(
                { userId, applicationId, versionId, commitSha: prepared.commitSha, gitPath: prepared.jsonPath },
                'Job CV was committed without a version record',
            );
            throw new DraftAlreadyClosedError();
        }
        this.logger.log(
            { userId, applicationId, versionId: saved.id, committed: prepared.commitSha !== null },
            'Job CV version saved',
        );
        return toSavedJobCv(saved, prepared.commitSha !== null);
    }

    private async restoreClaim(userId: string, applicationId: string, versionId: string, savingStartedAt: Date | null): Promise<void> {
        try {
            await this.tailorRepository.restoreSavingStart(userId, versionId, savingStartedAt);
        } catch (error) {
            this.logger.error({ userId, applicationId, versionId, err: error }, 'Could not restore the CV draft claim');
        }
    }

    private async reopenDraft(userId: string, applicationId: string, versionId: string): Promise<void> {
        try {
            await this.tailorRepository.releaseDraft(userId, versionId);
        } catch (error) {
            this.logger.error({ userId, applicationId, versionId, err: error }, 'Could not reopen the CV draft');
        }
    }

    private async resolveSource(
        userId: string,
        applicationId: string,
    ): Promise<{ document: CvDocument; openDraftId: string | null; parentId: string | null }> {
        const latest = await this.tailorRepository.findLatestVersion(userId, applicationId);
        if (!latest) {
            return { document: await this.baseDocument(userId), openDraftId: null, parentId: null };
        }
        if (latest.status === 'saving') {
            throw new DraftAlreadyClosedError();
        }
        const stored = readCvDocument(latest.cv) ?? (await this.baseDocument(userId));
        if (isOpenDraft(latest)) {
            return { document: stored, openDraftId: latest.id, parentId: latest.parentId };
        }
        return { document: stored, openDraftId: null, parentId: latest.id };
    }

    private async baseDocument(userId: string): Promise<CvDocument> {
        const editor = await this.cvService.getEditor(userId);
        return editor.document;
    }
}

function isStaleSaving(savingStartedAt: Date | null, now: Date): boolean {
    if (!savingStartedAt) {
        return true;
    }
    return now.getTime() - savingStartedAt.getTime() >= SAVING_STALE_AFTER_MS;
}

function labelsFrom(profile: Profile): Map<string, string> {
    return new Map(evidenceFromProfile(profile).map((item) => [item.id, item.label]));
}
