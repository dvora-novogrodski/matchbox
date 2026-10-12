import type { CvChangeOp, CvDocument } from '@matchbox/shared';

export const CV_SECTION_NAMES = ['header', 'summary', 'experience', 'projects', 'skills', 'education'] as const;
export type CvSectionName = (typeof CV_SECTION_NAMES)[number];

export type RoleSection = 'experience' | 'projects' | 'education';

export type ChangeTarget =
    | { kind: 'summary' }
    | { kind: 'headline' }
    | { kind: 'bullet'; section: RoleSection; entryIndex: number; bulletIndex: number }
    | { kind: 'skill'; index: number }
    | { kind: 'skillOrder' };

const BULLET_PATH = /^(experience|projects|education)\[(\d+)\]\.bullets\[(\d+)\]$/;
const SKILL_PATH = /^skills\[(\d+)\]$/;

export function parseChangeTarget(path: string, op: CvChangeOp): ChangeTarget | null {
    if (path === 'summary' && op === 'replace') {
        return { kind: 'summary' };
    }
    if (path === 'header.headline' && op === 'replace') {
        return { kind: 'headline' };
    }
    if (path === 'skills' && op === 'reorder') {
        return { kind: 'skillOrder' };
    }
    const bullet = BULLET_PATH.exec(path);
    if (bullet && (op === 'replace' || op === 'insert')) {
        return {
            kind: 'bullet',
            section: bullet[1] as RoleSection,
            entryIndex: Number(bullet[2]),
            bulletIndex: Number(bullet[3]),
        };
    }
    const skill = SKILL_PATH.exec(path);
    if (skill && op === 'replace') {
        return { kind: 'skill', index: Number(skill[1]) };
    }
    return null;
}

export function sectionFromPath(path: string): CvSectionName {
    if (path.startsWith('header')) {
        return 'header';
    }
    if (path.startsWith('experience')) {
        return 'experience';
    }
    if (path.startsWith('projects')) {
        return 'projects';
    }
    if (path.startsWith('education')) {
        return 'education';
    }
    if (path.startsWith('skills')) {
        return 'skills';
    }
    return 'summary';
}

export function skillOrder(document: CvDocument, after: string): CvDocument['skills'] | null {
    const wanted = after
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
    if (wanted.length !== document.skills.length) {
        return null;
    }
    const remaining = [...document.skills];
    const next: CvDocument['skills'] = [];
    for (const name of wanted) {
        const index = remaining.findIndex((skill) => skill.name === name);
        if (index < 0) {
            return null;
        }
        const skill = remaining[index];
        if (!skill) {
            return null;
        }
        next.push(skill);
        remaining.splice(index, 1);
    }
    return next;
}
