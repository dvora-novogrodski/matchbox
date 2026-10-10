import type { CareerItemKind } from '../generated/prisma/client';
import type {
    BulletInput,
    CreateProfileItemScalars,
    ProfileItemEntity,
    SkillEntity,
    UpdateProfileItemScalars,
} from './types/profile.types';

export abstract class ProfileRepository {
    abstract listItemsByKind(userId: string, kind: CareerItemKind): Promise<ProfileItemEntity[]>;
    abstract findItem(userId: string, itemId: string, kind: CareerItemKind): Promise<ProfileItemEntity | null>;
    abstract createItemWithBullets(
        userId: string,
        kind: CareerItemKind,
        scalars: CreateProfileItemScalars,
        bullets: BulletInput[],
    ): Promise<ProfileItemEntity>;
    abstract updateItemWithBullets(
        userId: string,
        itemId: string,
        kind: CareerItemKind,
        scalars: UpdateProfileItemScalars,
        bullets?: BulletInput[],
    ): Promise<ProfileItemEntity | null>;
    abstract deleteItem(userId: string, itemId: string, kind: CareerItemKind): Promise<boolean>;
    abstract listSkills(userId: string): Promise<SkillEntity[]>;
    abstract replaceSkills(userId: string, names: string[]): Promise<SkillEntity[]>;
}
