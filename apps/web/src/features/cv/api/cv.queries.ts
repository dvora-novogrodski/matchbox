import type { BaseCv, ConnectGithub } from '@matchbox/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { connectGithub, disconnectGithub, downloadCvPdf, getBaseCv, saveBaseCv, saveCvVersion } from './cv.api';

export const cvKeys = {
    all: ['cv'] as const,
    detail: () => [...cvKeys.all, 'detail'] as const,
};

export function useBaseCv() {
    return useQuery({
        queryKey: cvKeys.detail(),
        queryFn: getBaseCv,
    });
}

export function useSaveBaseCv() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (selection: BaseCv) => saveBaseCv(selection),
        onSuccess: (editor) => queryClient.setQueryData(cvKeys.detail(), editor),
    });
}

export function useSaveCvVersion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveCvVersion,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cvKeys.all }),
    });
}

export function useDownloadCvPdf() {
    return useMutation({ mutationFn: downloadCvPdf });
}

export function useConnectGithub() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ConnectGithub) => connectGithub(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cvKeys.all }),
    });
}

export function useDisconnectGithub() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: disconnectGithub,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cvKeys.all }),
    });
}
