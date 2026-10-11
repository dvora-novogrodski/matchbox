import type { BaseCv } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { CvUserNotFoundError } from './cv.errors';
import { CvRepository } from './cv.repository';
import type { NewBaseVersion, StoredCvVersion, UserCvRecord } from './types/cv.types';

@Injectable()
export class PrismaCvRepository extends CvRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findUserCvRecord(userId: string): Promise<UserCvRecord | null> {
        return this.prisma.user.findFirst({
            where: { id: userId },
            select: {
                displayName: true,
                email: true,
                baseCv: true,
                githubRepo: true,
                githubTokenEncrypted: true,
            },
        });
    }

    async saveBaseCv(userId: string, selection: BaseCv): Promise<void> {
        const result = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { baseCv: toJson(selection) },
        });
        if (result.count !== 1) {
            throw new CvUserNotFoundError();
        }
    }

    async saveGithubCredentials(userId: string, repo: string, tokenEncrypted: string): Promise<void> {
        const result = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { githubRepo: repo, githubTokenEncrypted: tokenEncrypted },
        });
        if (result.count !== 1) {
            throw new CvUserNotFoundError();
        }
    }

    async clearGithubCredentials(userId: string): Promise<void> {
        const result = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { githubRepo: null, githubTokenEncrypted: null },
        });
        if (result.count !== 1) {
            throw new CvUserNotFoundError();
        }
    }

    async createBaseVersion(userId: string, version: NewBaseVersion): Promise<StoredCvVersion> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.updateMany({
                where: { id: userId },
                data: { baseCv: toJson(version.selection) },
            });
            if (updated.count !== 1) {
                throw new CvUserNotFoundError();
            }
            const row = await tx.cvVersion.create({
                data: {
                    userId,
                    isBase: true,
                    cv: toJson(version.document),
                    templateId: version.templateId,
                    gitPath: version.gitPath,
                    commitSha: version.commitSha,
                },
            });
            return toStoredVersion(row);
        });
    }

    async findLatestBaseVersion(userId: string): Promise<StoredCvVersion | null> {
        const row = await this.prisma.cvVersion.findFirst({
            where: { userId, isBase: true },
            orderBy: { createdAt: 'desc' },
        });
        return row ? toStoredVersion(row) : null;
    }
}

function toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toStoredVersion(row: {
    id: string;
    isBase: boolean;
    templateId: string;
    gitPath: string | null;
    commitSha: string | null;
    createdAt: Date;
}): StoredCvVersion {
    return {
        id: row.id,
        isBase: row.isBase,
        templateId: row.templateId,
        gitPath: row.gitPath,
        commitSha: row.commitSha,
        createdAt: row.createdAt,
    };
}
