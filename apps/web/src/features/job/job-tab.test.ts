import { describe, expect, it } from 'vitest';

import { isJobTab, jobPath } from './job-tab';

describe('job tab', () => {
    it('should accept the job page tabs', () => {
        expect(isJobTab('overview')).toBe(true);
        expect(isJobTab('match')).toBe(true);
        expect(isJobTab('cv')).toBe(true);
        expect(isJobTab('kit')).toBe(true);
        expect(isJobTab('timeline')).toBe(true);
        expect(isJobTab('notes')).toBe(false);
        expect(isJobTab(undefined)).toBe(false);
    });

    it('should build a job path that includes the tab', () => {
        expect(jobPath('job-1')).toBe('/jobs/job-1/overview');
        expect(jobPath('job-1', 'timeline')).toBe('/jobs/job-1/timeline');
    });
});
