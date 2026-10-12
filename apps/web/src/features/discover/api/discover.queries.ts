import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationKeys } from 'src/features/pipeline';

import { listDiscover, saveDiscoveredJob, skipDiscoveredJob } from './discover.api';

export const discoverKeys = {
    all: ['discover'] as const,
    list: () => [...discoverKeys.all, 'list'] as const,
};

export function useDiscover() {
    return useQuery({
        queryKey: discoverKeys.list(),
        queryFn: listDiscover,
    });
}

export function useSaveDiscoveredJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobId: string) => saveDiscoveredJob(jobId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: discoverKeys.all }),
                queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
            ]);
        },
    });
}

export function useSkipDiscoveredJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobId: string) => skipDiscoveredJob(jobId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: discoverKeys.all });
        },
    });
}
