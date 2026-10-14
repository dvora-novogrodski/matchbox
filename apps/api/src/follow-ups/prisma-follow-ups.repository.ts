import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import { FollowUpsRepository } from './follow-ups.repository';
import type { FollowUpRecord } from './types/follow-ups.types';

const FOLLOW_UP_CATEGORIES = ['active', 'interviewing'] as const;

@Injectable()
export class PrismaFollowUpsRepository extends FollowUpsRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async listDue(userId: string, inactiveBefore: Date): Promise<FollowUpRecord[]> {
        const applications = await this.prisma.application.findMany({
            where: {
                userId,
                status: { category: { in: [...FOLLOW_UP_CATEGORIES] } },
                lastActivityAt: { lt: inactiveBefore },
            },
            orderBy: { lastActivityAt: 'asc' },
        });
        return applications.map((application) => ({
            applicationId: application.id,
            jobId: application.jobId,
            title: application.title,
            companyName: application.companyName,
            jobUrl: application.url,
            lastActivityAt: application.lastActivityAt,
        }));
    }

    async record(userId: string, applicationId: string, occurredAt: Date): Promise<boolean> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.application.updateMany({
                where: { id: applicationId, userId },
                data: { lastActivityAt: occurredAt },
            });
            if (updated.count === 0) {
                return false;
            }
            await tx.event.create({
                data: {
                    userId,
                    applicationId,
                    type: 'follow_up',
                    payload: {},
                    occurredAt,
                },
            });
            return true;
        });
    }
}
