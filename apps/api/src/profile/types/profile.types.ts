import type { CareerItemKind } from '../../generated/prisma/client';

export type ProfileBulletEntity = {
    id: string;
    text: string;
    position: number;
};

export type ProfileItemEntity = {
    id: string;
    kind: CareerItemKind;
    title: string;
    organization: string | null;
    startDate: string | null;
    endDate: string | null;
    tech: string[];
    bullets: ProfileBulletEntity[];
};

export type SkillEntity = {
    id: string;
    name: string;
    position: number;
};

export type CreateProfileItemScalars = {
    title: string;
    organization?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    tech?: string[];
};

export type UpdateProfileItemScalars = Partial<CreateProfileItemScalars>;

export type BulletInput = {
    id?: string;
    text: string;
};
