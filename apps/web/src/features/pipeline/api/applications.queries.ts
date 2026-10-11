import type { ChangeApplicationStatus } from '@matchbox/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { changeApplicationStatus, listApplications, listStatuses } from './applications.api';

export const applicationKeys = {
    all: ['applications'] as const,
    list: () => [...applicationKeys.all, 'list'] as const,
};

export const statusKeys = {
    all: ['statuses'] as const,
    list: () => [...statusKeys.all, 'list'] as const,
};

export function useStatuses() {
    return useQuery({
        queryKey: statusKeys.list(),
        queryFn: listStatuses,
    });
}

export function useApplications() {
    return useQuery({
        queryKey: applicationKeys.list(),
        queryFn: listApplications,
    });
}

export function useChangeApplicationStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ applicationId, statusId }: { applicationId: string } & ChangeApplicationStatus) =>
            changeApplicationStatus(applicationId, { statusId }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
    });
}
