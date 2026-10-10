import type { UpdateEducation, UpdateExperience, UpdateProject } from '@matchbox/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import {
    createEducation,
    createExperience,
    createProject,
    deleteEducation,
    deleteExperience,
    deleteProject,
    getProfile,
    replaceProfileSkills,
    updateEducation,
    updateExperience,
    updateProject,
} from './profile.api';

export const profileKeys = {
    all: ['profile'] as const,
    detail: () => [...profileKeys.all, 'detail'] as const,
};

export function useProfile() {
    return useQuery({
        queryKey: profileKeys.detail(),
        queryFn: getProfile,
    });
}

function invalidateProfile(queryClient: ReturnType<typeof useQueryClient>) {
    return queryClient.invalidateQueries({ queryKey: profileKeys.all });
}

export function useCreateExperience() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createExperience,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useUpdateExperience() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, input }: { itemId: string; input: UpdateExperience }) =>
            updateExperience(itemId, input),
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useDeleteExperience() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteExperience,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProject,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, input }: { itemId: string; input: UpdateProject }) => updateProject(itemId, input),
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProject,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useCreateEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEducation,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useUpdateEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, input }: { itemId: string; input: UpdateEducation }) => updateEducation(itemId, input),
        onSuccess: () => invalidateProfile(queryClient),
    });
}

export function useDeleteEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEducation,
        onSuccess: () => invalidateProfile(queryClient),
    });
}

type SkillsReplaceContext = {
    version: number;
};

export function useReplaceProfileSkills() {
    const queryClient = useQueryClient();
    const latestSaveVersionRef = useRef(0);

    return useMutation({
        mutationFn: replaceProfileSkills,
        scope: { id: 'profile-skills-replace' },
        onMutate: () => {
            const version = ++latestSaveVersionRef.current;
            return { version } satisfies SkillsReplaceContext;
        },
        onSuccess: (data, _names, context) => {
            const saveContext = context as SkillsReplaceContext | undefined;
            if (!saveContext || saveContext.version < latestSaveVersionRef.current) {
                return;
            }
            queryClient.setQueryData(profileKeys.detail(), (profile) =>
                profile ? { ...profile, skills: data.skills } : profile,
            );
        },
    });
}
