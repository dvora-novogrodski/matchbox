import type { Application, CreateManualJob, CvChangeDecision, JobMatchResponse, JobPage, SavedJobCv, TailorResult, UpdateApplication } from '@matchbox/shared';
import { ApplicationSchema, CreateManualJobSchema, CvChangeSchema, JobMatchResponseSchema, JobPageSchema, SavedJobCvSchema, TailorResultSchema, UpdateApplicationSchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getJobPage(jobId: string): Promise<JobPage> {
    const response = await httpClient.get<unknown>(`/jobs/${jobId}`);
    return JobPageSchema.parse(response.data);
}

export async function createManualJob(input: CreateManualJob): Promise<Application> {
    const response = await httpClient.post<unknown>('/jobs', CreateManualJobSchema.parse(input));
    return ApplicationSchema.parse(response.data);
}

export async function getJobMatch(jobId: string): Promise<JobMatchResponse> {
    const response = await httpClient.get<unknown>(`/jobs/${jobId}/match`);
    return JobMatchResponseSchema.parse(response.data);
}

export async function updateApplication(applicationId: string, input: UpdateApplication): Promise<Application> {
    const response = await httpClient.patch<unknown>(`/applications/${applicationId}`, UpdateApplicationSchema.parse(input));
    return ApplicationSchema.parse(response.data);
}

export async function getCvChanges(applicationId: string): Promise<TailorResult> {
    const response = await httpClient.get<unknown>(`/applications/${applicationId}/cv-changes`);
    return TailorResultSchema.parse(response.data);
}

export async function tailorCv(applicationId: string): Promise<TailorResult> {
    const response = await httpClient.post<unknown>(`/applications/${applicationId}/tailor`);
    return TailorResultSchema.parse(response.data);
}

export async function decideCvChange(applicationId: string, changeId: string, decision: CvChangeDecision): Promise<void> {
    const response = await httpClient.patch<unknown>(`/applications/${applicationId}/cv-changes/${changeId}`, { decision });
    CvChangeSchema.parse(response.data);
}

export async function saveJobCv(applicationId: string): Promise<SavedJobCv> {
    const response = await httpClient.post<unknown>(`/applications/${applicationId}/cv-versions`);
    return SavedJobCvSchema.parse(response.data);
}
