export type FollowUpRecord = {
    applicationId: string;
    jobId: string;
    title: string;
    companyName: string;
    jobUrl: string | null;
    lastActivityAt: Date;
};
