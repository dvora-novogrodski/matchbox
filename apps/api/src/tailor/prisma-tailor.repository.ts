import { type CvChangeOp, type CvChangeState, type CvDocument, DEFAULT_CV_TEMPLATE_ID } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import type { CvSectionName } from './cv-change-path';
import {
    type JobCvVersionRow,
    type SaveProposalsInput,
    type StoredCvChange,
    type TailorApplication,
    TailorRepository,
} from './tailor.repository';

const evidenceIdSchema = z.array(z.uuid());

@Injectable()
export class PrismaTailorRepository extends TailorRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findApplication(userId: string, applicationId: string): Promise<TailorApplication | null> {
        const application = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            select: {
                id: true,
                companyName: true,
                title: true,
                description: true,
                job: { select: { requirements: true } },
            },
        });
        if (!application) {
            return null;
        }
        return {
            id: application.id,
            companyName: application.companyName,
            title: application.title,
            description: application.description,
            requirements: application.job.requirements,
        };
    }

    async findLatestVersion(userId: string, applicationId: string): Promise<JobCvVersionRow | null> {
        const row = await this.prisma.cvVersion.findFirst({
            where: { userId, applicationId },
            orderBy: { createdAt: 'desc' },
        });
        return row ? toVersion(row) : null;
    }

    async saveProposals(userId: string, input: SaveProposalsInput): Promise<StoredCvChange[]> {
        return this.prisma.$transaction(async (tx) => {
            const versionId = await openDraftId(tx, userId, input);
            await tx.cvChange.deleteMany({ where: { userId, cvVersionId: versionId } });
            const stored: StoredCvChange[] = [];
            for (const change of input.changes) {
                const row = await tx.cvChange.create({
                    data: {
                        userId,
                        cvVersionId: versionId,
                        section: change.section,
                        targetPath: change.path,
                        op: change.op,
                        before: change.before,
                        after: change.after,
                        evidenceIds: toJson(change.evidenceIds),
                        evidenceItemId: change.evidenceItemId,
                        state: change.state,
                        rationale: change.rationale,
                        blockedReason: change.blockedReason,
                        model: change.model,
                        promptVersion: change.promptVersion,
                        runId: change.runId,
                    },
                });
                stored.push(toChange(row, true));
            }
            return stored;
        });
    }

    async listOpenChanges(userId: string, applicationId: string): Promise<StoredCvChange[]> {
        const draft = await this.prisma.cvVersion.findFirst({
            where: { userId, applicationId, status: 'open' },
            orderBy: { createdAt: 'desc' },
            include: { changes: { orderBy: { createdAt: 'asc' } } },
        });
        return draft ? draft.changes.map((change) => toChange(change, true)) : [];
    }

    async listVersionChanges(userId: string, versionId: string): Promise<StoredCvChange[]> {
        const rows = await this.prisma.cvChange.findMany({
            where: { userId, cvVersionId: versionId, cvVersion: { userId } },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((change) => toChange(change, true));
    }

    async findChange(userId: string, applicationId: string, changeId: string): Promise<StoredCvChange | null> {
        const row = await this.prisma.cvChange.findFirst({
            where: { id: changeId, userId, cvVersion: { userId, applicationId } },
            include: { cvVersion: { select: { status: true } } },
        });
        if (!row) {
            return null;
        }
        return toChange(row, row.cvVersion.status === 'open');
    }

    async decide(
        userId: string,
        changeId: string,
        state: 'accepted' | 'rejected',
        decidedAt: Date,
    ): Promise<StoredCvChange | null> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.cvChange.updateMany({
                where: {
                    id: changeId,
                    userId,
                    state: { not: 'blocked' },
                    cvVersion: { userId, status: 'open' },
                },
                data: { state, decidedAt },
            });
            if (updated.count !== 1) {
                return null;
            }
            const row = await tx.cvChange.findFirst({ where: { id: changeId, userId } });
            return row ? toChange(row, true) : null;
        });
    }

    async claimDraft(userId: string, versionId: string, gitPath: string, savingStartedAt: Date): Promise<boolean> {
        const updated = await this.prisma.cvVersion.updateMany({
            where: { id: versionId, userId, status: 'open' },
            data: { status: 'saving', savingStartedAt, gitPath },
        });
        return updated.count === 1;
    }

    async reclaimStaleDraft(
        userId: string,
        versionId: string,
        gitPath: string,
        savingStartedAt: Date,
        staleBefore: Date,
    ): Promise<boolean> {
        const updated = await this.prisma.cvVersion.updateMany({
            where: {
                id: versionId,
                userId,
                status: 'saving',
                OR: [{ savingStartedAt: null }, { savingStartedAt: { lte: staleBefore } }],
            },
            data: { savingStartedAt, gitPath },
        });
        return updated.count === 1;
    }

    async restoreSavingStart(userId: string, versionId: string, savingStartedAt: Date | null): Promise<void> {
        await this.prisma.cvVersion.updateMany({
            where: { id: versionId, userId, status: 'saving' },
            data: { savingStartedAt },
        });
    }

    async releaseDraft(userId: string, versionId: string): Promise<void> {
        await this.prisma.cvVersion.updateMany({
            where: { id: versionId, userId, status: 'saving' },
            data: { status: 'open', savingStartedAt: null },
        });
    }

    async finalizeDraft(
        userId: string,
        versionId: string,
        document: CvDocument,
        gitPath: string,
        commitSha: string | null,
    ): Promise<JobCvVersionRow | null> {
        const updated = await this.prisma.cvVersion.updateMany({
            where: { id: versionId, userId, status: 'saving' },
            data: { cv: toJson(document), gitPath, commitSha, status: 'saved' },
        });
        if (updated.count !== 1) {
            return null;
        }
        const row = await this.prisma.cvVersion.findFirst({ where: { id: versionId, userId } });
        return row ? toVersion(row) : null;
    }
}

async function openDraftId(tx: Prisma.TransactionClient, userId: string, input: SaveProposalsInput): Promise<string> {
    if (input.openDraftId) {
        const updated = await tx.cvVersion.updateMany({
            where: {
                id: input.openDraftId,
                userId,
                applicationId: input.applicationId,
                status: 'open',
            },
            data: { cv: toJson(input.document) },
        });
        if (updated.count === 1) {
            return input.openDraftId;
        }
    }
    const existing = await tx.cvVersion.findFirst({
        where: { userId, applicationId: input.applicationId, status: 'open' },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
    });
    if (existing) {
        await tx.cvVersion.update({
            where: { id: existing.id },
            data: { cv: toJson(input.document) },
        });
        return existing.id;
    }
    const created = await tx.cvVersion.create({
        data: {
            userId,
            applicationId: input.applicationId,
            parentId: input.parentId,
            isBase: false,
            cv: toJson(input.document),
            templateId: DEFAULT_CV_TEMPLATE_ID,
            status: 'open',
        },
    });
    return created.id;
}

function toVersion(row: {
    id: string;
    parentId: string | null;
    cv: Prisma.JsonValue;
    gitPath: string | null;
    commitSha: string | null;
    isBase: boolean;
    templateId: string;
    status: JobCvVersionRow['status'];
    savingStartedAt: Date | null;
    createdAt: Date;
}): JobCvVersionRow {
    return {
        id: row.id,
        parentId: row.parentId,
        cv: row.cv,
        gitPath: row.gitPath,
        commitSha: row.commitSha,
        isBase: row.isBase,
        templateId: row.templateId,
        status: row.status,
        savingStartedAt: row.savingStartedAt,
        createdAt: row.createdAt,
    };
}

function toChange(
    row: {
        id: string;
        targetPath: string | null;
        op: string;
        section: CvSectionName;
        before: string | null;
        after: string;
        evidenceIds: Prisma.JsonValue;
        evidenceItemId: string | null;
        rationale: string | null;
        state: CvChangeState;
        blockedReason: string | null;
        model: string;
        promptVersion: string;
        runId: string | null;
    },
    draftOpen: boolean,
): StoredCvChange {
    const evidenceIds = evidenceIdSchema.safeParse(row.evidenceIds);
    return {
        id: row.id,
        path: row.targetPath ?? '',
        op: readOp(row.op),
        section: row.section,
        before: row.before,
        after: row.after,
        evidenceIds: evidenceIds.success ? evidenceIds.data : [],
        evidenceItemId: row.evidenceItemId,
        rationale: row.rationale ?? '',
        state: row.state,
        blockedReason: row.blockedReason,
        model: row.model,
        promptVersion: row.promptVersion,
        runId: row.runId,
        draftOpen,
    };
}

function readOp(value: string): CvChangeOp {
    if (value === 'insert' || value === 'reorder') {
        return value;
    }
    return 'replace';
}

function toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
