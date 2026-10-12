import type { CvDocument } from '@matchbox/shared';

import { BLOCKED_REASONS, reviewCvChange } from './review-cv-change';

const EVIDENCE_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';
const OTHER_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd199';

function document(): CvDocument {
    return {
        header: {
            fullName: 'Ada Lovelace',
            headline: 'Engineer',
            email: null,
            phone: null,
            location: null,
            links: [],
        },
        summary: 'Builds systems',
        experience: [
            {
                careerItemId: EVIDENCE_ID,
                title: 'Engineer',
                organization: 'Acme',
                startDate: null,
                endDate: null,
                tech: [],
                bullets: ['Shipped the API'],
            },
        ],
        projects: [],
        skills: [{ skillId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd125', name: 'TypeScript' }],
        education: [],
    };
}

function review(overrides: Partial<Parameters<typeof reviewCvChange>[0]> = {}) {
    return reviewCvChange(
        {
            path: 'experience[0].bullets[0]',
            op: 'replace',
            before: 'Shipped the API',
            after: 'Shipped the public API',
            evidenceIds: [EVIDENCE_ID],
            rationale: 'Matches the posting',
            state: 'proposed',
            blockedReason: null,
            ...overrides,
        },
        {
            document: document(),
            ownedIds: new Set([EVIDENCE_ID]),
            skillNames: new Set(['TypeScript']),
        },
    );
}

describe('reviewCvChange', () => {
    it('should keep a change proposed when the evidence belongs to the user and the target exists', () => {
        expect(review().state).toBe('proposed');
        expect(review().blockedReason).toBeNull();
    });

    it('should block a change that cites no evidence', () => {
        const change = review({ evidenceIds: [] });

        expect(change.state).toBe('blocked');
        expect(change.blockedReason).toBe(BLOCKED_REASONS.noEvidence);
    });

    it('should block a change whose evidence is not in the profile', () => {
        const change = review({ evidenceIds: [OTHER_ID] });

        expect(change.state).toBe('blocked');
        expect(change.blockedReason).toBe(BLOCKED_REASONS.unknownEvidence);
        expect(change.evidenceIds).toEqual([]);
    });

    it('should block a change when the CV text no longer matches', () => {
        const change = review({ before: 'A different bullet' });

        expect(change.state).toBe('blocked');
        expect(change.blockedReason).toBe(BLOCKED_REASONS.textChanged);
    });

    it('should keep a model-blocked change blocked when the evidence is valid', () => {
        const change = review({ state: 'blocked', blockedReason: 'The judge rejected this claim' });

        expect(change.state).toBe('blocked');
        expect(change.blockedReason).toBe('The judge rejected this claim');
    });

    it('should block a skill that is not already on the profile', () => {
        const change = review({
            path: 'skills[0]',
            op: 'replace',
            before: 'TypeScript',
            after: 'Rust',
        });

        expect(change.state).toBe('blocked');
        expect(change.blockedReason).toBe(BLOCKED_REASONS.unknownSkill);
    });
});
