import { CV_LIMITS, type CvChangeOp, type CvDocument, PROFILE_LIMITS } from '@matchbox/shared';

import { type ChangeTarget, type CvSectionName, parseChangeTarget, sectionFromPath, skillOrder } from './cv-change-path';

export const BLOCKED_REASONS = {
    noEvidence: 'No career evidence supports this change',
    unknownEvidence: 'The evidence is not in your profile',
    missingTarget: 'That part of the CV does not exist',
    textChanged: 'The CV text no longer matches this change',
    tooLong: 'This would make the CV too long',
    emptyText: 'The new text is empty',
    unknownSkill: 'New skills have to come from your profile',
    unsupported: 'This change cannot be applied',
} as const;

const MAX_EVIDENCE_IDS = 20;
const MAX_RATIONALE_LENGTH = 2_000;

export type IncomingCvChange = {
    path: string;
    op: CvChangeOp;
    before: string | null;
    after: string;
    evidenceIds: string[];
    rationale: string;
    state: 'proposed' | 'blocked';
    blockedReason: string | null;
};

export type ReviewedCvChange = {
    path: string;
    op: CvChangeOp;
    section: CvSectionName;
    before: string | null;
    after: string;
    evidenceIds: string[];
    rationale: string;
    state: 'proposed' | 'blocked';
    blockedReason: string | null;
};

type ReviewContext = {
    document: CvDocument;
    ownedIds: ReadonlySet<string>;
    skillNames: ReadonlySet<string>;
};

export function reviewCvChange(change: IncomingCvChange, context: ReviewContext): ReviewedCvChange {
    const cited = unique(change.evidenceIds);
    const evidenceIds = cited.filter((id) => context.ownedIds.has(id)).slice(0, MAX_EVIDENCE_IDS);
    const base: ReviewedCvChange = {
        path: change.path,
        op: change.op,
        section: sectionFromPath(change.path),
        before: change.before,
        after: change.after,
        evidenceIds,
        rationale: change.rationale.slice(0, MAX_RATIONALE_LENGTH),
        state: 'proposed',
        blockedReason: null,
    };
    const problem = problemWith(change, cited, context);
    if (problem) {
        return { ...base, state: 'blocked', blockedReason: problem };
    }
    if (change.state === 'blocked') {
        const reason = change.blockedReason?.trim();
        return { ...base, state: 'blocked', blockedReason: reason ? reason : BLOCKED_REASONS.unsupported };
    }
    return base;
}

function problemWith(change: IncomingCvChange, cited: string[], context: ReviewContext): string | null {
    if (cited.length === 0) {
        return BLOCKED_REASONS.noEvidence;
    }
    if (cited.some((id) => !context.ownedIds.has(id))) {
        return BLOCKED_REASONS.unknownEvidence;
    }
    if (cited.length > MAX_EVIDENCE_IDS) {
        return BLOCKED_REASONS.unsupported;
    }
    const target = parseChangeTarget(change.path, change.op);
    if (!target) {
        return BLOCKED_REASONS.unsupported;
    }
    if (change.after.length === 0 && target.kind !== 'summary') {
        return BLOCKED_REASONS.emptyText;
    }
    if (exceedsLimit(target, change.after)) {
        return BLOCKED_REASONS.tooLong;
    }
    if (target.kind === 'skill' && !context.skillNames.has(change.after)) {
        return BLOCKED_REASONS.unknownSkill;
    }
    if (target.kind === 'skillOrder' && skillOrder(context.document, change.after) === null) {
        return BLOCKED_REASONS.unsupported;
    }
    return locationProblem(target, change, context.document);
}

function exceedsLimit(target: ChangeTarget, after: string): boolean {
    if (target.kind === 'summary') {
        return after.length > CV_LIMITS.maxSummaryLength;
    }
    if (target.kind === 'headline') {
        return after.length > CV_LIMITS.maxHeadlineLength;
    }
    if (target.kind === 'skill') {
        return after.length > PROFILE_LIMITS.maxSkillNameLength;
    }
    if (target.kind === 'bullet') {
        return after.length > PROFILE_LIMITS.maxBulletTextLength;
    }
    return false;
}

function locationProblem(target: ChangeTarget, change: IncomingCvChange, document: CvDocument): string | null {
    if (target.kind === 'summary') {
        return textMismatch(change.before, document.summary);
    }
    if (target.kind === 'headline') {
        return textMismatch(change.before, document.header.headline ?? '');
    }
    if (target.kind === 'skillOrder') {
        return null;
    }
    if (target.kind === 'skill') {
        const skill = document.skills[target.index];
        if (!skill) {
            return BLOCKED_REASONS.missingTarget;
        }
        return textMismatch(change.before, skill.name);
    }
    const entry = document[target.section][target.entryIndex];
    if (!entry) {
        return BLOCKED_REASONS.missingTarget;
    }
    if (change.op === 'insert') {
        return target.bulletIndex > entry.bullets.length ? BLOCKED_REASONS.missingTarget : null;
    }
    const current = entry.bullets[target.bulletIndex];
    if (current === undefined) {
        return BLOCKED_REASONS.missingTarget;
    }
    return textMismatch(change.before, current);
}

function textMismatch(before: string | null, current: string): string | null {
    if (before !== null && before !== current) {
        return BLOCKED_REASONS.textChanged;
    }
    return null;
}

function unique(ids: string[]): string[] {
    return [...new Set(ids)];
}
