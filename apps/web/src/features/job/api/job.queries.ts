import type { CreateManualJob } from '@matchbox/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationKeys, changeApplicationStatus } from 'src/features/pipeline';

import { createManualJob, decideCvChange, getCvChanges, getJobMatch, getJobPage, saveJobCv, tailorCv, updateApplication } from './job.api';

export const jobKeys = {
    all: ['jobs'] as const,
    detail: (jobId: string) => [...jobKeys.all, 'detail', jobId] as const,
    match: (jobId: string) => [...jobKeys.all, 'match', jobId] as const,
    changes: (applicationId: string) => [...jobKeys.all, 'changes', applicationId] as const,
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

export function useCvChanges(applicationId: string) {
    return useQuery({
        queryKey: jobKeys.changes(applicationId),
        queryFn: () => getCvChanges(applicationId),
        enabled: applicationId.length > 0,
    });
}

export function useTailorCv(jobId: string, applicationId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => tailorCv(applicationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: jobKeys.changes(applicationId) });
            void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
        },
    });
}

export function useDecideCvChange(applicationId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ changeId, decision }: { changeId: string; decision: Parameters<typeof decideCvChange>[2] }) =>
            decideCvChange(applicationId, changeId, decision),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: jobKeys.changes(applicationId) });
        },
    });
}

export function useSaveJobCv(jobId: string, applicationId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => saveJobCv(applicationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: jobKeys.changes(applicationId) });
            void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
            void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        },
    });
}
