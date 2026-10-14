import type { Profile } from '@matchbox/shared';

export function profileHeadline(profile: Profile): string | null {
    const current = profile.experience.find((item) => item.endDate === null);
    const primary = current ?? profile.experience[0];
    if (primary) {
        return primary.organization ? `${primary.title} · ${primary.organization}` : primary.title;
    }
    return null;
}
