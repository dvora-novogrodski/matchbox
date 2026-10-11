import { describe, expect, it } from 'vitest';

import { jobPrimaryAction } from './job-action';

describe('jobPrimaryAction', () => {
    it('should ask to tailor a CV when the application has none', () => {
        expect(jobPrimaryAction({ appliedAt: null, category: 'open', cvVersionCount: 0, tab: 'overview' })).toBe(
            'tailorCv',
        );
    });

    it('should ask to prepare an application once a CV exists', () => {
        expect(jobPrimaryAction({ appliedAt: null, category: 'open', cvVersionCount: 1, tab: 'overview' })).toBe(
            'prepareToApply',
        );
    });

    it('should ask to mark the application as applied from the kit', () => {
        expect(jobPrimaryAction({ appliedAt: null, category: 'open', cvVersionCount: 1, tab: 'kit' })).toBe(
            'markApplied',
        );
    });

    it('should hide the primary action after the application is applied or closed', () => {
        expect(
            jobPrimaryAction({
                appliedAt: '2026-10-11T09:00:00.000Z',
                category: 'active',
                cvVersionCount: 1,
                tab: 'kit',
            }),
        ).toBeNull();
        expect(jobPrimaryAction({ appliedAt: null, category: 'closed', cvVersionCount: 0, tab: 'overview' })).toBeNull();
    });
});
