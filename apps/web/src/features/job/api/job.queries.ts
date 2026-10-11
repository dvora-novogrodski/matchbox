import type { CreateManualJob } from '@matchbox/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationKeys, changeApplicationStatus } from 'src/features/pipeline';

import { createManualJob, getJobMatch, getJobPage, updateApplication } from './job.api';

export const jobKeys = {
    all: ['jobs'] as const,
    detail: (jobId: string) => [...jobKeys.all, 'detail', jobId] as const,
    match: (jobId: string) => [...jobKeys.all, 'match', jobId] as const,
};

export function useJobPage(jobId: string) {
    return useQuery({
        queryKey: jobKeys.detail(jobId),
        queryFn: () => getJobPage(jobId),
        enabled: jobId.length > 0,
    });
}

export function useJobMatch(jobId: string) {
    return useQuery({
        queryKey: jobKeys.match(jobId),
        queryFn: () => getJobMatch(jobId),
        enabled: jobId.length > 0,
        retry: false,
    });
}

export function useUpdateApplication(jobId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ applicationId, input }: { applicationId: string; input: Parameters<typeof updateApplication>[1] }) =>
            updateApplication(applicationId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
            void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
        },
    });
}

export function useCreateManualJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateManualJob) => createManualJob(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        },
    });
}

export function useChangeJobStatus(jobId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ applicationId, statusId }: { applicationId: string; statusId: string }) =>
            changeApplicationStatus(applicationId, { statusId }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
            void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
        },
    });
}
