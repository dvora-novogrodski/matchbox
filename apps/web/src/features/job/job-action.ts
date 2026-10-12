import type { StatusCategory } from '@matchbox/shared';

import type { JobTab } from './job-tab';

export type JobPrimaryAction = 'tailorCv' | 'prepareToApply' | 'markApplied';

export function jobPrimaryAction(input: {
    appliedAt: string | null;
    category: StatusCategory;
    cvVersionCount: number;
    tab: JobTab;
}): JobPrimaryAction | null {
    if (input.appliedAt !== null || input.category === 'closed') {
        return null;
    }
    if (input.cvVersionCount === 0) {
        return input.tab === 'cv' ? null : 'tailorCv';
    }
    if (input.tab === 'kit') {
        return 'markApplied';
    }
    return 'prepareToApply';
}
