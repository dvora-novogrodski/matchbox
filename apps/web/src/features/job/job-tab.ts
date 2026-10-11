export const JOB_TABS = ['overview', 'cv', 'kit', 'timeline'] as const;
export type JobTab = (typeof JOB_TABS)[number];

export function isJobTab(value: string | undefined): value is JobTab {
    return value === 'overview' || value === 'cv' || value === 'kit' || value === 'timeline';
}

export function jobPath(jobId: string, tab: JobTab = 'overview'): string {
    return `/jobs/${jobId}/${tab}`;
}
