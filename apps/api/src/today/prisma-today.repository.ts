import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import { TodayRepository } from './today.repository';
import type { TodayApplicationRecord } from './types/today.types';

const IN_PROGRESS_CATEGORIES = ['active', 'interviewing', 'offer'] as const;

@Injectable()
export class PrismaTodayRepository extends TodayRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async listWithoutTailoredCv(userId: string): Promise<TodayApplicationRecord[]> {
        const applications = await this.prisma.application.findMany({
            where: {
                userId,
                status: { category: 'open' },
                cvVersions: { none: { status: 'saved' } },
            },
            orderBy: { lastActivityAt: 'asc' },
        });
        return applications.map(toRecord);
    }

    countInProgress(userId: string): Promise<number> {
        return this.prisma.application.count({
            where: {
                userId,
                status: { category: { in: [...IN_PROGRESS_CATEGORIES] } },
            },
        });
    }
}

function toRecord(application: {
    id: string;
    jobId: string;
    title: string;
    companyName: string;
    lastActivityAt: Date;
}): TodayApplicationRecord {
    return {
        applicationId: application.id,
        jobId: application.jobId,
        title: application.title,
        companyName: application.companyName,
        lastActivityAt: application.lastActivityAt,
    };
}
