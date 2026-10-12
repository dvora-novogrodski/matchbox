import { EVENT_TYPES, type EventType, WORK_MODES, type WorkMode } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { toSystemStatusKey } from '../statuses/status-key';
import { ApplicationsRepository } from './applications.repository';
import type {
    ApplicationDetailsUpdate,
    ApplicationRecord,
    ApplicationStatusChange,
    CreateManualJobResult,
    JobPageRecord,
    ManualJobDraft,
    MatchLookup,
} from './types/applications.types';

const applicationInclude = {
    job: true,
    status: true,
} satisfies Prisma.ApplicationInclude;

type ApplicationRow = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;

const jobPageInclude = {
    job: true,
    status: true,
    events: { orderBy: { occurredAt: 'desc' as const } },
    cvVersions: {
        orderBy: { createdAt: 'desc' as const },
        select: { id: true, isBase: true, commitSha: true, status: true, createdAt: true },
    },
} satisfies Prisma.ApplicationInclude;

type JobPageRow = Prisma.ApplicationGetPayload<{ include: typeof jobPageInclude }>;

@Injectable()
export class PrismaApplicationsRepository extends ApplicationsRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async list(userId: string): Promise<ApplicationRecord[]> {
        const applications = await this.prisma.application.findMany({
            where: { userId },
            include: applicationInclude,
            orderBy: [{ status: { position: 'asc' } }, { lastActivityAt: 'desc' }],
        });
        return applications.map((application) => this.toApplication(application));
    }

    async findPageByJobId(userId: string, jobId: string): Promise<JobPageRecord | null> {
        const application = await this.prisma.application.findFirst({
            where: { userId, jobId },
            include: jobPageInclude,
        });
        if (!application) {
            return null;
        }
        return {
            application: this.toApplication(application),
            description: application.description,
            requirements: application.job.requirements,
            events: application.events.map((event) => ({
                id: event.id,
                type: toEventType(event.type),
                occurredAt: event.occurredAt,
                payload: event.payload,
            })),
            cvVersions: application.cvVersions
                .filter((version) => version.status === 'saved')
                .map((version) => ({
                    id: version.id,
                    isBase: version.isBase,
                    commitSha: version.commitSha,
                    createdAt: version.createdAt,
                })),
        };
    }

    async findMatchByJobId(userId: string, jobId: string): Promise<MatchLookup> {
        const application = await this.prisma.application.findFirst({
            where: { userId, jobId },
            select: { id: true },
        });
        if (!application) {
            return { kind: 'not-found' };
        }

        const match = await this.prisma.jobMatch.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });
        if (!match) {
            return { kind: 'none' };
        }
        return {
            kind: 'found',
            match: {
                score: match.score,
                coverage: match.coverage,
                model: match.model,
                promptVersion: match.promptVersion,
            },
        };
    }

    async findById(userId: string, applicationId: string): Promise<ApplicationRecord | null> {
        const application = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: applicationInclude,
        });
        return application ? this.toApplication(application) : null;
    }

    async changeStatus(
        userId: string,
        applicationId: string,
        change: ApplicationStatusChange,
    ): Promise<ApplicationRecord | null> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.application.updateMany({
                where: { id: applicationId, userId },
                data: {
                    statusId: change.statusId,
                    appliedAt: change.appliedAt,
                    lastActivityAt: change.lastActivityAt,
                },
            });
            if (updated.count !== 1) {
                return null;
            }

            await tx.event.create({
                data: {
                    userId,
                    applicationId,
                    type: 'status_changed',
                    payload: { fromStatusId: change.fromStatusId, toStatusId: change.statusId },
                    occurredAt: change.occurredAt,
                },
            });

            const application = await tx.application.findFirst({
                where: { id: applicationId, userId },
                include: applicationInclude,
            });
            return application ? this.toApplication(application) : null;
        });
    }

    async createManual(
        userId: string,
        draft: ManualJobDraft,
        statusId: string,
        occurredAt: Date,
    ): Promise<CreateManualJobResult> {
        const job = await this.findOrCreateJob(draft.normalizedUrl);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const existing = await tx.application.findUnique({
                    where: { userId_jobId: { userId, jobId: job.id } },
                });
                if (existing) {
                    return { kind: 'exists', jobId: job.id };
                }

                const application = await tx.application.create({
                    data: {
                        userId,
                        jobId: job.id,
                        statusId,
                        lastActivityAt: occurredAt,
                        companyName: draft.companyName,
                        title: draft.title,
                        url: draft.url,
                        location: draft.location,
                        workMode: draft.workMode,
                        description: draft.description,
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
                return { kind: 'created', application: this.toApplication(application) };
            });
        } catch (error) {
            if (isUniqueViolation(error)) {
                return { kind: 'exists', jobId: job.id };
            }
            throw error;
        }
    }

    async updateDetails(
        userId: string,
        applicationId: string,
        update: ApplicationDetailsUpdate,
    ): Promise<ApplicationRecord | null> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.application.updateMany({
                where: { id: applicationId, userId },
                data: {
                    recruiterName: update.recruiterName,
                    recruiterContact: update.recruiterContact,
                    notes: update.notes,
                    lastActivityAt: update.lastActivityAt,
                },
            });
            if (updated.count !== 1) {
                return null;
            }

            if (update.note) {
                await tx.event.create({
                    data: {
                        userId,
                        applicationId,
                        type: 'note',
                        payload: { text: update.note.text },
                        occurredAt: update.note.occurredAt,
                    },
                });
            }

            const application = await tx.application.findFirst({
                where: { id: applicationId, userId },
                include: applicationInclude,
            });
            return application ? this.toApplication(application) : null;
        });
    }

    private async findOrCreateJob(normalizedUrl: string | null) {
        if (normalizedUrl) {
            const existing = await this.prisma.job.findUnique({ where: { normalizedUrl } });
            if (existing) {
                return existing;
            }
        }

        try {
            return await this.prisma.job.create({
                data: {
                    source: 'manual',
                    normalizedUrl,
                },
            });
        } catch (error) {
            if (!isUniqueViolation(error) || !normalizedUrl) {
                throw error;
            }
            const existing = await this.prisma.job.findUnique({ where: { normalizedUrl } });
            if (!existing) {
                throw error;
            }
            return existing;
        }
    }

    private toApplication(application: ApplicationRow | JobPageRow): ApplicationRecord {
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
}

function isUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return false;
    }
    return error.code === 'P2002';
}

function toEventType(type: string): EventType {
    return (EVENT_TYPES as readonly string[]).includes(type) ? (type as EventType) : 'created';
}

function toWorkMode(mode: string | null): WorkMode | null {
    if (mode === null) {
        return null;
    }
    return (WORK_MODES as readonly string[]).includes(mode) ? (mode as WorkMode) : null;
}
