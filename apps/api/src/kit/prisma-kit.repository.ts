import type { UpdateApplicationKit } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { KitRepository } from './kit.repository';
import type { KitRecord } from './types/kit.types';

@Injectable()
export class PrismaKitRepository extends KitRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async find(userId: string, applicationId: string): Promise<KitRecord | null> {
        const application = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            select: {
                kit: true,
                cvVersions: {
                    where: { status: 'saved' },
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                    select: { cv: true },
                },
            },
        });
        if (!application) {
            return null;
        }
        return {
            kit: application.kit,
            cv: application.cvVersions[0]?.cv ?? null,
        };
    }

    async save(userId: string, applicationId: string, kit: UpdateApplicationKit): Promise<boolean> {
        const updated = await this.prisma.application.updateMany({
            where: { id: applicationId, userId },
            data: { kit: toJson(kit) },
        });
        return updated.count === 1;
    }
}

function toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
