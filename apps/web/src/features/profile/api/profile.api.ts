import {
    type CreateEducation,
    type CreateExperience,
    type CreateProject,
    type Profile,
    ProfileSchema,
    ProfileEducationSchema,
    ProfileExperienceSchema,
    ProfileProjectSchema,
    ReplaceProfileSkillsResponseSchema,
    type UpdateEducation,
    type UpdateExperience,
    type UpdateProject,
} from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getProfile(): Promise<Profile> {
    const response = await httpClient.get<unknown>('/profile');
    return ProfileSchema.parse(response.data);
}

export async function createExperience(input: CreateExperience) {
    const response = await httpClient.post<unknown>('/profile/experience', input);
    return ProfileExperienceSchema.parse(response.data);
}

export async function updateExperience(itemId: string, input: UpdateExperience) {
    const response = await httpClient.patch<unknown>(`/profile/experience/${itemId}`, input);
    return ProfileExperienceSchema.parse(response.data);
}

export async function deleteExperience(itemId: string): Promise<void> {
    await httpClient.delete(`/profile/experience/${itemId}`);
}

export async function createProject(input: CreateProject) {
    const response = await httpClient.post<unknown>('/profile/projects', input);
    return ProfileProjectSchema.parse(response.data);
}

export async function updateProject(itemId: string, input: UpdateProject) {
    const response = await httpClient.patch<unknown>(`/profile/projects/${itemId}`, input);
    return ProfileProjectSchema.parse(response.data);
}

export async function deleteProject(itemId: string): Promise<void> {
    await httpClient.delete(`/profile/projects/${itemId}`);
}

export async function createEducation(input: CreateEducation) {
    const response = await httpClient.post<unknown>('/profile/education', input);
    return ProfileEducationSchema.parse(response.data);
}

export async function updateEducation(itemId: string, input: UpdateEducation) {
    const response = await httpClient.patch<unknown>(`/profile/education/${itemId}`, input);
    return ProfileEducationSchema.parse(response.data);
}

export async function deleteEducation(itemId: string): Promise<void> {
    await httpClient.delete(`/profile/education/${itemId}`);
}

export async function replaceProfileSkills(skills: string[]) {
    const response = await httpClient.put<unknown>('/profile/skills', { skills });
    return ReplaceProfileSkillsResponseSchema.parse(response.data);
}
