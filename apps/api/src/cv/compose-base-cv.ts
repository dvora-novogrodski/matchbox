import type { BaseCv, CvCatalog, CvDocument, Profile } from '@matchbox/shared';

export function selectionFromProfile(profile: Profile, user: { displayName: string | null; email: string }): BaseCv {
    const fullName = user.displayName?.trim() || user.email;
    return {
        header: {
            fullName,
            headline: null,
            email: user.email,
            phone: null,
            location: null,
            links: [],
        },
        summary: '',
        experienceItemIds: profile.experience.map((item) => item.id),
        projectItemIds: profile.projects.map((item) => item.id),
        skillIds: profile.skills.map((skill) => skill.id),
        educationItemIds: profile.education.map((item) => item.id),
    };
}

export function countRemovedIds(profile: Profile, selection: BaseCv): number {
    return (
        missingCount(selection.experienceItemIds, profile.experience) +
        missingCount(selection.projectItemIds, profile.projects) +
        missingCount(selection.skillIds, profile.skills) +
        missingCount(selection.educationItemIds, profile.education)
    );
}

export function pruneSelection(profile: Profile, selection: BaseCv): BaseCv {
    return {
        ...selection,
        experienceItemIds: keepIds(selection.experienceItemIds, profile.experience),
        projectItemIds: keepIds(selection.projectItemIds, profile.projects),
        skillIds: keepIds(selection.skillIds, profile.skills),
        educationItemIds: keepIds(selection.educationItemIds, profile.education),
    };
}

export function composeCvDocument(profile: Profile, selection: BaseCv): CvDocument {
    return {
        header: selection.header,
        summary: selection.summary,
        experience: pickOrdered(profile.experience, selection.experienceItemIds).map((item) => ({
            careerItemId: item.id,
            title: item.title,
            organization: item.organization,
            startDate: item.startDate,
            endDate: item.endDate,
            tech: item.tech,
            bullets: item.bullets.map((bullet) => bullet.text),
        })),
        projects: pickOrdered(profile.projects, selection.projectItemIds).map((item) => ({
            careerItemId: item.id,
            title: item.title,
            organization: item.organization,
            startDate: item.startDate,
            endDate: item.endDate,
            tech: item.tech,
            bullets: item.bullets.map((bullet) => bullet.text),
        })),
        skills: pickOrdered(profile.skills, selection.skillIds).map((skill) => ({
            skillId: skill.id,
            name: skill.name,
        })),
        education: pickOrdered(profile.education, selection.educationItemIds).map((item) => ({
            careerItemId: item.id,
            degree: item.degree,
            institution: item.institution,
            startDate: item.startDate,
            endDate: item.endDate,
            bullets: item.bullets.map((bullet) => bullet.text),
        })),
    };
}

export function catalogFromProfile(profile: Profile): CvCatalog {
    return {
        experience: profile.experience.map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: item.organization,
        })),
        projects: profile.projects.map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: item.organization,
        })),
        skills: profile.skills.map((skill) => ({
            id: skill.id,
            title: skill.name,
            subtitle: null,
        })),
        education: profile.education.map((item) => ({
            id: item.id,
            title: item.degree,
            subtitle: item.institution,
        })),
    };
}

function missingCount(ids: string[], items: { id: string }[]): number {
    return ids.length - keepIds(ids, items).length;
}

function keepIds(ids: string[], items: { id: string }[]): string[] {
    const allowed = new Set(items.map((item) => item.id));
    return ids.filter((id) => allowed.has(id));
}

function pickOrdered<T extends { id: string }>(items: T[], ids: string[]): T[] {
    const byId = new Map(items.map((item) => [item.id, item]));
    return ids.flatMap((id) => {
        const item = byId.get(id);
        return item ? [item] : [];
    });
}
