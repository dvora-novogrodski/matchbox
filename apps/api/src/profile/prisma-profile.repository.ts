import { BadRequestException, Injectable } from '@nestjs/common';

import type { CareerItem, CareerItemKind, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { profileItemOrderBy } from './profile-item-order';
import { ProfileBulletNotFoundError } from './profile.errors';
import { ProfileRepository } from './profile.repository';
import { normalizeSkillName } from './profile-skill.utils';
import type {
    BulletInput,
    CreateProfileItemScalars,
    ProfileBulletEntity,
    ProfileItemEntity,
    SkillEntity,
    UpdateProfileItemScalars,
} from './types/profile.types';

type ItemWithBullets = CareerItem & { bullets: { id: string; text: string; position: number }[] };

@Injectable()
export class PrismaProfileRepository extends ProfileRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    listItemsByKind(userId: string, kind: CareerItemKind): Promise<ProfileItemEntity[]> {
        return this.prisma.careerItem
            .findMany({
                where: { userId, kind },
                include: { bullets: { orderBy: { position: 'asc' } } },
                orderBy: profileItemOrderBy,
            })
            .then((items) => items.map((item) => this.toItemEntity(item)));
    }

    findItem(userId: string, itemId: string, kind: CareerItemKind): Promise<ProfileItemEntity | null> {
        return this.prisma.careerItem
            .findFirst({
                where: { id: itemId, userId, kind },
                include: { bullets: { orderBy: { position: 'asc' } } },
            })
            .then((item) => (item ? this.toItemEntity(item) : null));
    }

    async createItemWithBullets(
        userId: string,
        kind: CareerItemKind,
        scalars: CreateProfileItemScalars,
        bullets: BulletInput[],
    ): Promise<ProfileItemEntity> {
        return this.prisma.$transaction(async (tx) => {
            const item = await tx.careerItem.create({
                data: this.toCreateData(userId, kind, scalars),
            });
            await this.syncBullets(tx, item.id, bullets);
            const loaded = await tx.careerItem.findFirstOrThrow({
                where: { id: item.id },
                include: { bullets: { orderBy: { position: 'asc' } } },
            });
            return this.toItemEntity(loaded);
        });
    }

    async updateItemWithBullets(
        userId: string,
        itemId: string,
        kind: CareerItemKind,
        scalars: UpdateProfileItemScalars,
        bullets?: BulletInput[],
    ): Promise<ProfileItemEntity | null> {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.careerItem.findFirst({
                where: { id: itemId, userId, kind },
            });
            if (!existing) {
                return null;
            }

            const data = this.toUpdateData(scalars);
            if (Object.keys(data).length > 0) {
                await tx.careerItem.update({
                    where: { id: itemId },
                    data,
                });
            }

            if (bullets !== undefined) {
                await this.syncBullets(tx, itemId, bullets);
            }

            const loaded = await tx.careerItem.findFirst({
                where: { id: itemId, userId, kind },
                include: { bullets: { orderBy: { position: 'asc' } } },
            });
            return loaded ? this.toItemEntity(loaded) : null;
        });
    }

    async deleteItem(userId: string, itemId: string, kind: CareerItemKind): Promise<boolean> {
        const result = await this.prisma.careerItem.deleteMany({
            where: { id: itemId, userId, kind },
        });
        return result.count === 1;
    }

    listSkills(userId: string): Promise<SkillEntity[]> {
        return this.prisma.skill
            .findMany({
                where: { userId },
                orderBy: { position: 'asc' },
            })
            .then((skills) => skills.map((skill) => ({ id: skill.id, name: skill.name, position: skill.position })));
    }

    async replaceSkills(userId: string, names: string[]): Promise<SkillEntity[]> {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.skill.findMany({ where: { userId } });
            const existingByNormalized = new Map(existing.map((skill) => [skill.nameNormalized, skill]));
            const normalizedInPayload = new Set<string>();

            for (let position = 0; position < names.length; position++) {
                const name = names[position];
                const nameNormalized = normalizeSkillName(name);
                normalizedInPayload.add(nameNormalized);
                const match = existingByNormalized.get(nameNormalized);
                if (match) {
                    await tx.skill.update({
                        where: { id: match.id },
                        data: { name, position },
                    });
                } else {
                    const created = await tx.skill.create({
                        data: { userId, name, nameNormalized, position },
                    });
                    existingByNormalized.set(nameNormalized, created);
                }
            }

            await tx.skill.deleteMany({
                where: { userId, nameNormalized: { notIn: [...normalizedInPayload] } },
            });

            const updated = await tx.skill.findMany({
                where: { userId },
                orderBy: { position: 'asc' },
            });
            return updated.map((skill) => ({ id: skill.id, name: skill.name, position: skill.position }));
        });
    }

    private async syncBullets(
        tx: Prisma.TransactionClient,
        itemId: string,
        bullets: BulletInput[],
    ): Promise<void> {
        const idsInPayload = bullets.map((bullet) => bullet.id).filter((id): id is string => Boolean(id));
        if (new Set(idsInPayload).size !== idsInPayload.length) {
            throw new BadRequestException('Duplicate bullet ids in request');
        }

        const existing = await tx.careerBullet.findMany({ where: { itemId } });
        const existingById = new Map(existing.map((bullet) => [bullet.id, bullet]));

        for (const id of idsInPayload) {
            if (!existingById.has(id)) {
                throw new ProfileBulletNotFoundError(id);
            }
        }

        for (let position = 0; position < bullets.length; position++) {
            const bullet = bullets[position];
            if (bullet.id) {
                await tx.careerBullet.update({
                    where: { id: bullet.id },
                    data: { text: bullet.text, position },
                });
            } else {
                await tx.careerBullet.create({
                    data: { itemId, text: bullet.text, position },
                });
            }
        }

        const mentioned = new Set(idsInPayload);
        const toDelete = existing.filter((bullet) => !mentioned.has(bullet.id)).map((bullet) => bullet.id);
        if (toDelete.length > 0) {
            await tx.careerBullet.deleteMany({ where: { id: { in: toDelete } } });
        }
    }

    private toCreateData(
        userId: string,
        kind: CareerItemKind,
        scalars: CreateProfileItemScalars,
    ): Prisma.CareerItemUncheckedCreateInput {
        return {
            userId,
            kind,
            title: scalars.title,
            organization: scalars.organization ?? null,
            startDate: this.toDate(scalars.startDate),
            endDate: this.toDate(scalars.endDate),
            tech: scalars.tech ?? [],
        };
    }

    private toUpdateData(scalars: UpdateProfileItemScalars): Prisma.CareerItemUncheckedUpdateInput {
        const data: Prisma.CareerItemUncheckedUpdateInput = {};
        if (scalars.title !== undefined) data.title = scalars.title;
        if (scalars.organization !== undefined) data.organization = scalars.organization;
        if (scalars.startDate !== undefined) data.startDate = this.toDate(scalars.startDate);
        if (scalars.endDate !== undefined) data.endDate = this.toDate(scalars.endDate);
        if (scalars.tech !== undefined) data.tech = scalars.tech;
        return data;
    }

    private toDate(value: string | null | undefined): Date | null | undefined {
        if (value === undefined) {
            return undefined;
        }
        return value ? new Date(`${value}T00:00:00.000Z`) : null;
    }

    private toItemEntity(item: ItemWithBullets): ProfileItemEntity {
        return {
            id: item.id,
            kind: item.kind,
            title: item.title,
            organization: item.organization,
            startDate: item.startDate?.toISOString().slice(0, 10) ?? null,
            endDate: item.endDate?.toISOString().slice(0, 10) ?? null,
            tech: item.tech,
            bullets: item.bullets.map((bullet) => ({
                id: bullet.id,
                text: bullet.text,
                position: bullet.position,
            })),
        };
    }
}
