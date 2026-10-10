import type {
    CreateEducation,
    CreateExperience,
    CreateProject,
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileProject,
    ProfileSkill,
    ReplaceProfileSkillsResponse,
    UpdateEducation,
    UpdateExperience,
    UpdateProject,
} from '@matchbox/shared';

import type { ProfileItemEntity, SkillEntity } from './types/profile.types';

function toBullets(item: ProfileItemEntity) {
    return item.bullets.map((bullet) => ({ id: bullet.id, text: bullet.text }));
}

export function toProfileExperience(item: ProfileItemEntity): ProfileExperience {
    return {
        id: item.id,
        title: item.title,
        organization: item.organization,
        startDate: item.startDate,
        endDate: item.endDate,
        tech: item.tech,
        bullets: toBullets(item),
    };
}

export function toProfileProject(item: ProfileItemEntity): ProfileProject {
    return toProfileExperience(item);
}

export function toProfileEducation(item: ProfileItemEntity): ProfileEducation {
    return {
        id: item.id,
        degree: item.title,
        institution: item.organization,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: toBullets(item),
    };
}

export function toProfileSkill(skill: SkillEntity): ProfileSkill {
    return { id: skill.id, name: skill.name };
}

export function toProfile(
    experience: ProfileItemEntity[],
    projects: ProfileItemEntity[],
    education: ProfileItemEntity[],
    skills: SkillEntity[],
): Profile {
    return {
        experience: experience.map(toProfileExperience),
        projects: projects.map(toProfileProject),
        education: education.map(toProfileEducation),
        skills: skills.map(toProfileSkill),
    };
}

export function toReplaceSkillsResponse(skills: SkillEntity[]): ReplaceProfileSkillsResponse {
    return { skills: skills.map(toProfileSkill) };
}

export function fromCreateExperience(dto: CreateExperience) {
    return {
        scalars: {
            title: dto.title,
            organization: dto.organization ?? null,
            startDate: dto.startDate ?? null,
            endDate: dto.endDate ?? null,
            tech: dto.tech ?? [],
        },
        bullets: dto.bullets ?? [],
    };
}

export function fromUpdateExperience(dto: UpdateExperience) {
    return {
        scalars: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.organization !== undefined ? { organization: dto.organization } : {}),
            ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
            ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
            ...(dto.tech !== undefined ? { tech: dto.tech } : {}),
        },
        bullets: dto.bullets,
    };
}

export function fromCreateProject(dto: CreateProject) {
    return fromCreateExperience(dto);
}

export function fromUpdateProject(dto: UpdateProject) {
    return fromUpdateExperience(dto);
}

export function fromCreateEducation(dto: CreateEducation) {
    return {
        scalars: {
            title: dto.degree,
            organization: dto.institution ?? null,
            startDate: dto.startDate ?? null,
            endDate: dto.endDate ?? null,
            tech: [],
        },
        bullets: dto.bullets ?? [],
    };
}

export function fromUpdateEducation(dto: UpdateEducation) {
    return {
        scalars: {
            ...(dto.degree !== undefined ? { title: dto.degree } : {}),
            ...(dto.institution !== undefined ? { organization: dto.institution } : {}),
            ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
            ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
        },
        bullets: dto.bullets,
    };
}
