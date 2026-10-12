import type { CvChange, CvDocument, Profile, SavedJobCv } from '@matchbox/shared';
import { CvDocumentSchema, JobRequirementSchema } from '@matchbox/shared';
import { z } from 'zod';

import type { JobCvVersionRow, StoredCvChange } from './tailor.repository';

const requirementsSchema = z.array(JobRequirementSchema);

export function readCvDocument(value: unknown): CvDocument | null {
    const parsed = CvDocumentSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

export function readRequirements(value: unknown) {
    const parsed = requirementsSchema.safeParse(value);
    return parsed.success ? parsed.data : [];
}

export function evidenceFromProfile(profile: Profile): { id: string; label: string; text: string; careerItem: boolean }[] {
    const roles = [...profile.experience, ...profile.projects].map((item) => ({
        id: item.id,
        label: item.title,
        text: item.bullets.map((bullet) => bullet.text).join('\n'),
        careerItem: true,
    }));
    const education = profile.education.map((item) => ({
        id: item.id,
        label: item.degree,
        text: item.bullets.map((bullet) => bullet.text).join('\n'),
        careerItem: true,
    }));
    const skills = profile.skills.map((skill) => ({
        id: skill.id,
        label: skill.name,
        text: skill.name,
        careerItem: false,
    }));
    return [...roles, ...education, ...skills];
}

export function toCvChange(change: StoredCvChange, labels: ReadonlyMap<string, string>): CvChange {
    return {
        id: change.id,
        path: change.path,
        op: change.op,
        before: change.before,
        after: change.after,
        evidence_ids: change.evidenceIds,
        evidence: change.evidenceIds.map((id) => ({
            id,
            label: labels.get(id) ?? '',
        })),
        rationale: change.rationale,
        state: change.state,
        blocked_reason: change.blockedReason,
    };
}

export function toSavedJobCv(version: JobCvVersionRow, githubSynced: boolean): SavedJobCv {
    return {
        version: {
            id: version.id,
            isBase: version.isBase,
            commitSha: version.commitSha,
            createdAt: version.createdAt.toISOString(),
        },
        githubSynced,
    };
}

export function isOpenDraft(version: JobCvVersionRow): boolean {
    return version.status === 'open';
}
