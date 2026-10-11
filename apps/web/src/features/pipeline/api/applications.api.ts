import type { Application, ApplicationList, ChangeApplicationStatus, StatusList } from '@matchbox/shared';
import { ApplicationListSchema, ApplicationSchema, StatusListSchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function listStatuses(): Promise<StatusList> {
    const response = await httpClient.get<unknown>('/statuses');
    return StatusListSchema.parse(response.data);
}

export async function listApplications(): Promise<ApplicationList> {
    const response = await httpClient.get<unknown>('/applications');
    return ApplicationListSchema.parse(response.data);
}

export async function changeApplicationStatus(
    applicationId: string,
    input: ChangeApplicationStatus,
): Promise<Application> {
    const response = await httpClient.patch<unknown>(`/applications/${applicationId}/status`, input);
    return ApplicationSchema.parse(response.data);
}
