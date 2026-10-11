import { WORK_MODES, type WorkMode } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { toSystemStatusKey } from '../statuses/status-key';
import { ApplicationsRepository } from './applications.repository';
import type { ApplicationRecord, ApplicationStatusChange } from './types/applications.types';

const applicationInclude = {
    job: true,
    status: true,
} satisfies Prisma.ApplicationInclude;

type ApplicationRow = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;

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

    private toApplication(application: ApplicationRow): ApplicationRecord {
        return {
            id: application.id,
            job: {
                id: application.job.id,
                title: application.job.title,
                companyName: application.job.companyName,
                location: application.job.location,
                workMode: toWorkMode(application.job.workMode),
                url: application.job.url,
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

function toWorkMode(mode: string | null): WorkMode | null {
    if (mode === null) {
        return null;
    }
    return (WORK_MODES as readonly string[]).includes(mode) ? (mode as WorkMode) : null;
}
