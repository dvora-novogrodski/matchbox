import type { Application, DiscoverList } from '@matchbox/shared';
import { ApplicationSchema, DiscoverListSchema } from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function listDiscover(): Promise<DiscoverList> {
    const response = await httpClient.get<unknown>('/discover');
    return DiscoverListSchema.parse(response.data);
}

export async function saveDiscoveredJob(jobId: string): Promise<Application> {
    const response = await httpClient.post<unknown>(`/jobs/${jobId}/save`);
    return ApplicationSchema.parse(response.data);
}

export async function skipDiscoveredJob(jobId: string): Promise<void> {
    await httpClient.post(`/jobs/${jobId}/skip`);
}
