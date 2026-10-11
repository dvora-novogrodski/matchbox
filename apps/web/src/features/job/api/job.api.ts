import type { Application, CreateManualJob, JobPage, UpdateApplication } from '@matchbox/shared';
import { ApplicationSchema, CreateManualJobSchema, JobPageSchema, UpdateApplicationSchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getJobPage(jobId: string): Promise<JobPage> {
    const response = await httpClient.get<unknown>(`/jobs/${jobId}`);
    return JobPageSchema.parse(response.data);
}

export async function createManualJob(input: CreateManualJob): Promise<Application> {
    const response = await httpClient.post<unknown>('/jobs', CreateManualJobSchema.parse(input));
    return ApplicationSchema.parse(response.data);
}

export async function updateApplication(applicationId: string, input: UpdateApplication): Promise<Application> {
    const response = await httpClient.patch<unknown>(`/applications/${applicationId}`, UpdateApplicationSchema.parse(input));
    return ApplicationSchema.parse(response.data);
}
