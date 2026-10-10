import type {
    CreateEducation,
    CreateExperience,
    CreateProject,
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileProject,
    ReplaceProfileSkillsResponse,
    UpdateEducation,
    UpdateExperience,
    UpdateProject,
} from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { ProfileItemNotFoundError } from './profile.errors';
import {
    fromCreateEducation,
    fromCreateExperience,
    fromCreateProject,
    fromUpdateEducation,
    fromUpdateExperience,
    fromUpdateProject,
    toProfile,
    toProfileEducation,
    toProfileExperience,
    toProfileProject,
    toReplaceSkillsResponse,
} from './profile.mapper';
import { ProfileRepository } from './profile.repository';
import { dedupeSkillNames } from './profile-skill.utils';

@Injectable()
export class ProfileService {
    constructor(private readonly profileRepository: ProfileRepository) {}

    async getProfile(userId: string): Promise<Profile> {
        const [experience, projects, education, skills] = await Promise.all([
            this.profileRepository.listItemsByKind(userId, 'experience'),
            this.profileRepository.listItemsByKind(userId, 'project'),
            this.profileRepository.listItemsByKind(userId, 'education'),
            this.profileRepository.listSkills(userId),
        ]);
        return toProfile(experience, projects, education, skills);
    }

    async createExperience(userId: string, input: CreateExperience): Promise<ProfileExperience> {
        const { scalars, bullets } = fromCreateExperience(input);
        const item = await this.profileRepository.createItemWithBullets(userId, 'experience', scalars, bullets);
        return toProfileExperience(item);
    }

    async updateExperience(userId: string, itemId: string, input: UpdateExperience): Promise<ProfileExperience> {
        const { scalars, bullets } = fromUpdateExperience(input);
        const item = await this.profileRepository.updateItemWithBullets(
            userId,
            itemId,
            'experience',
            scalars,
            bullets,
        );
        if (!item) {
            throw new ProfileItemNotFoundError(itemId);
        }
        return toProfileExperience(item);
    }

    async deleteExperience(userId: string, itemId: string): Promise<void> {
        await this.deleteItem(userId, itemId, 'experience');
    }

    async createProject(userId: string, input: CreateProject): Promise<ProfileProject> {
        const { scalars, bullets } = fromCreateProject(input);
        const item = await this.profileRepository.createItemWithBullets(userId, 'project', scalars, bullets);
        return toProfileProject(item);
    }

    async updateProject(userId: string, itemId: string, input: UpdateProject): Promise<ProfileProject> {
        const { scalars, bullets } = fromUpdateProject(input);
        const item = await this.profileRepository.updateItemWithBullets(userId, itemId, 'project', scalars, bullets);
        if (!item) {
            throw new ProfileItemNotFoundError(itemId);
        }
        return toProfileProject(item);
    }

    async deleteProject(userId: string, itemId: string): Promise<void> {
        await this.deleteItem(userId, itemId, 'project');
    }

    async createEducation(userId: string, input: CreateEducation): Promise<ProfileEducation> {
        const { scalars, bullets } = fromCreateEducation(input);
        const item = await this.profileRepository.createItemWithBullets(userId, 'education', scalars, bullets);
        return toProfileEducation(item);
    }

    async updateEducation(userId: string, itemId: string, input: UpdateEducation): Promise<ProfileEducation> {
        const { scalars, bullets } = fromUpdateEducation(input);
        const item = await this.profileRepository.updateItemWithBullets(userId, itemId, 'education', scalars, bullets);
        if (!item) {
            throw new ProfileItemNotFoundError(itemId);
        }
        return toProfileEducation(item);
    }

    async deleteEducation(userId: string, itemId: string): Promise<void> {
        await this.deleteItem(userId, itemId, 'education');
    }

    async replaceSkills(userId: string, names: string[]): Promise<ReplaceProfileSkillsResponse> {
        const skills = await this.profileRepository.replaceSkills(userId, dedupeSkillNames(names));
        return toReplaceSkillsResponse(skills);
    }

    private async deleteItem(
        userId: string,
        itemId: string,
        kind: 'experience' | 'project' | 'education',
    ): Promise<void> {
        const wasDeleted = await this.profileRepository.deleteItem(userId, itemId, kind);
        if (!wasDeleted) {
            throw new ProfileItemNotFoundError(itemId);
        }
    }
}
