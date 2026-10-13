import { useQuery } from '@tanstack/react-query';

import { getToday } from './today.api';

export const todayKeys = {
    all: ['today'] as const,
    detail: () => [...todayKeys.all, 'detail'] as const,
};

export function useToday() {
    return useQuery({
        queryKey: todayKeys.detail(),
        queryFn: getToday,
    });
}
