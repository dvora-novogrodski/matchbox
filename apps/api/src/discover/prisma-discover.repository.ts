import { WORK_MODES, type WorkMode } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { toSystemStatusKey } from '../statuses/status-key';
import { DiscoverRepository } from './discover.repository';
import type {
    DiscoverPosting,
    SavedApplicationRecord,
    SaveDiscoveredJobResult,
    SkipDiscoveredJobResult,
} from './types/discover.types';

const applicationInclude = {
    job: true,
    status: true,
} satisfies Prisma.ApplicationInclude;

type ApplicationRow = Prisma.ApplicationGetPayload<{
    include: typeof applicationInclude;
}>;

@Injectable()
export class PrismaDiscoverRepository extends DiscoverRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async listPending(userId: string): Promise<DiscoverPosting[]> {
        const matches = await this.prisma.jobMatch.findMany({
            where: {
                userId,
                decision: 'pending',
                job: { title: { not: null }, companyId: { not: null } },
            },
            include: { job: { include: { company: true } } },
            orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        });

        const items: DiscoverPosting[] = [];
        for (const match of matches) {
            const title = match.job.title;
            const companyName = match.job.company?.name;
            if (!title || !companyName) {
                continue;
            }
            items.push({
                jobId: match.jobId,
                title,
                companyName,
                location: match.job.location,
                workMode: toWorkMode(match.job.workMode),
                url: match.job.url,
                description: match.job.description,
                score: match.score,
            });
        }
        return items;
    }

    async save(userId: string, jobId: string, statusId: string, occurredAt: Date): Promise<SaveDiscoveredJobResult> {
        try {
            return await this.prisma.$transaction((tx) =>
                this.saveInTransaction(tx, userId, jobId, statusId, occurredAt),
            );
        } catch (error) {
            if (!isUniqueViolation(error)) {
                throw error;
            }
            const application = await this.prisma.application.findUnique({
                where: { userId_jobId: { userId, jobId } },
                include: applicationInclude,
            });
            if (!application) {
                throw error;
            }
            return { kind: 'saved', application: toSavedApplication(application) };
        }
    }

    async skip(userId: string, jobId: string, occurredAt: Date): Promise<SkipDiscoveredJobResult> {
        return this.prisma.$transaction(async (tx) => {
            const match = await tx.jobMatch.findUnique({
                where: { userId_jobId: { userId, jobId } },
            });
            if (!match) {
                return { kind: 'missing' };
            }
            if (match.decision === 'saved') {
                return { kind: 'saved' };
            }
            if (match.decision === 'skipped') {
                return { kind: 'skipped' };
            }

            const updated = await tx.jobMatch.updateMany({
                where: { id: match.id, userId, decision: 'pending' },
                data: { decision: 'skipped', decidedAt: occurredAt },
            });
            if (updated.count === 1) {
                return { kind: 'skipped' };
            }

            const current = await tx.jobMatch.findFirst({
                where: { id: match.id, userId },
            });
            if (!current || current.decision === 'pending') {
                return { kind: 'missing' };
            }
            return current.decision === 'saved' ? { kind: 'saved' } : { kind: 'skipped' };
        });
    }

    private async saveInTransaction(
        tx: Prisma.TransactionClient,
        userId: string,
        jobId: string,
        statusId: string,
        occurredAt: Date,
    ): Promise<SaveDiscoveredJobResult> {
        const match = await tx.jobMatch.findUnique({
            where: { userId_jobId: { userId, jobId } },
            include: { job: { include: { company: true } } },
        });
        if (!match) {
            return { kind: 'missing' };
        }
        if (match.decision === 'skipped') {
            return { kind: 'skipped' };
        }

        const existing = await tx.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
            include: applicationInclude,
        });
        if (match.decision === 'saved' && existing) {
            return { kind: 'saved', application: toSavedApplication(existing) };
        }

        const title = match.job.title;
        const companyName = match.job.company?.name;
        if (!title || !companyName) {
            return { kind: 'incomplete' };
        }

        if (match.decision === 'pending') {
            const updated = await tx.jobMatch.updateMany({
                where: { id: match.id, userId, decision: 'pending' },
                data: { decision: 'saved', decidedAt: occurredAt },
            });
            if (updated.count === 0) {
                const current = await tx.jobMatch.findFirst({
                    where: { id: match.id, userId },
                });
                if (!current || current.decision === 'skipped') {
                    return { kind: 'skipped' };
                }
            }
        }

        if (existing) {
            return { kind: 'saved', application: toSavedApplication(existing) };
        }

        const application = await tx.application.create({
            data: {
                userId,
                jobId,
                statusId,
                companyName,
                title,
                location: match.job.location,
                workMode: match.job.workMode,
                url: match.job.url,
                description: match.job.description,
                lastActivityAt: occurredAt,
            },
            include: applicationInclude,
        });
        await tx.event.create({
            data: {
                userId,
                applicationId: application.id,
                type: 'created',
                payload: {},
                occurredAt,
            },
        });
        return { kind: 'saved', application: toSavedApplication(application) };
    }
}

function toSavedApplication(application: ApplicationRow): SavedApplicationRecord {
    return {
        id: application.id,
        job: {
            id: application.job.id,
            title: application.title,
            companyName: application.companyName,
            location: application.location,
            workMode: toWorkMode(application.workMode),
            url: application.url,
        },
        status: {
            id: application.status.id,
            key: toSystemStatusKey(application.status.key),
            name: application.status.name,
            color: application.status.color,
            position: application.status.position,
            category: application.status.category,
        },
        recruiterName: application.recruiterName,
        recruiterContact: application.recruiterContact,
        notes: application.notes,
        appliedAt: application.appliedAt,
        lastActivityAt: application.lastActivityAt,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
    };
}

function toWorkMode(mode: string | null): WorkMode | null {
    if (mode === null) {
        return null;
    }
    return (WORK_MODES as readonly string[]).includes(mode) ? (mode as WorkMode) : null;
}

function isUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return false;
    }
    return error.code === 'P2002';
}
