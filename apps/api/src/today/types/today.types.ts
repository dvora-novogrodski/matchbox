export type TodayApplicationRecord = {
    applicationId: string;
    jobId: string;
    title: string;
    companyName: string;
    jobUrl: string | null;
    lastActivityAt: Date;
};
