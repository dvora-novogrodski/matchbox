import type { CvChangeOp, CvDocument } from '@matchbox/shared';

import { parseChangeTarget, skillOrder } from './cv-change-path';

export class CvChangeApplyError extends Error {
    constructor() {
        super('An accepted change could not be applied');
        this.name = 'CvChangeApplyError';
    }
}

type ApplicableChange = {
    path: string;
    op: CvChangeOp;
    after: string;
};

/** Applies accepted changes in order. A later change to the same place wins. */
export function applyCvChanges(document: CvDocument, changes: ApplicableChange[]): CvDocument {
    const next = structuredClone(document);
    for (const change of changes) {
        applyOne(next, change);
    }
    return next;
}

function applyOne(document: CvDocument, change: ApplicableChange): void {
    const target = parseChangeTarget(change.path, change.op);
    if (!target) {
        throw new CvChangeApplyError();
    }
    if (target.kind === 'summary') {
        document.summary = change.after;
        return;
    }
    if (target.kind === 'headline') {
        document.header.headline = change.after.length > 0 ? change.after : null;
        return;
    }
    if (target.kind === 'skillOrder') {
        const skills = skillOrder(document, change.after);
        if (!skills) {
            throw new CvChangeApplyError();
        }
        document.skills = skills;
        return;
    }
    if (target.kind === 'skill') {
        const skill = document.skills[target.index];
        if (!skill) {
            throw new CvChangeApplyError();
        }
        skill.name = change.after;
        return;
    }
    const entry = document[target.section][target.entryIndex];
    if (!entry) {
        throw new CvChangeApplyError();
    }
    if (change.op === 'insert') {
        if (target.bulletIndex > entry.bullets.length) {
            throw new CvChangeApplyError();
        }
        entry.bullets.splice(target.bulletIndex, 0, change.after);
        return;
    }
    if (entry.bullets[target.bulletIndex] === undefined) {
        throw new CvChangeApplyError();
    }
    entry.bullets[target.bulletIndex] = change.after;
}
