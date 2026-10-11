import type { SystemStatusKey } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';
import type { StatusDef } from '../generated/prisma/client';
import { toSystemStatusKey } from './status-key';
import { StatusesRepository } from './statuses.repository';
import type { StatusRecord } from './types/statuses.types';

@Injectable()
export class PrismaStatusesRepository extends StatusesRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async listVisible(userId: string): Promise<StatusRecord[]> {
        const statuses = await this.prisma.statusDef.findMany({
            where: { OR: [{ userId: null }, { userId }] },
            orderBy: { position: 'asc' },
        });
        return statuses.map((status) => this.toStatus(status));
    }

    async findSystemByKey(key: SystemStatusKey): Promise<StatusRecord | null> {
        const status = await this.prisma.statusDef.findFirst({
            where: { key, userId: null },
        });
        return status ? this.toStatus(status) : null;
    }

    async findVisible(userId: string, statusId: string): Promise<StatusRecord | null> {
        const status = await this.prisma.statusDef.findFirst({
            where: { id: statusId, OR: [{ userId: null }, { userId }] },
        });
        return status ? this.toStatus(status) : null;
    }

    private toStatus(status: StatusDef): StatusRecord {
        return {
            id: status.id,
            key: toSystemStatusKey(status.key),
            name: status.name,
            color: status.color,
            position: status.position,
            category: status.category,
        };
    }
}
