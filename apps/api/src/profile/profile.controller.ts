import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    CreateEducationRequestDto,
    CreateExperienceRequestDto,
    CreateProjectRequestDto,
    ProfileEducationResponseDto,
    ProfileExperienceResponseDto,
    ProfileProjectResponseDto,
    ProfileResponseDto,
    ReplaceProfileSkillsRequestDto,
    ReplaceProfileSkillsResponseDto,
    UpdateEducationRequestDto,
    UpdateExperienceRequestDto,
    UpdateProjectRequestDto,
} from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller({ path: 'profile', version: '1' })
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    @ZodSerializerDto(ProfileResponseDto)
    getProfile(@CurrentUser() user: AuthUser): Promise<ProfileResponseDto> {
        return this.profileService.getProfile(user.id);
    }

    @Post('experience')
    @ZodSerializerDto(ProfileExperienceResponseDto)
    createExperience(
        @CurrentUser() user: AuthUser,
        @Body() body: CreateExperienceRequestDto,
    ): Promise<ProfileExperienceResponseDto> {
        return this.profileService.createExperience(user.id, body);
    }

    @Patch('experience/:itemId')
    @ZodSerializerDto(ProfileExperienceResponseDto)
    updateExperience(
        @CurrentUser() user: AuthUser,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() body: UpdateExperienceRequestDto,
    ): Promise<ProfileExperienceResponseDto> {
        return this.profileService.updateExperience(user.id, itemId, body);
    }

    @Delete('experience/:itemId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteExperience(@CurrentUser() user: AuthUser, @Param('itemId', ParseUUIDPipe) itemId: string): Promise<void> {
        return this.profileService.deleteExperience(user.id, itemId);
    }

    @Post('projects')
    @ZodSerializerDto(ProfileProjectResponseDto)
    createProject(
        @CurrentUser() user: AuthUser,
        @Body() body: CreateProjectRequestDto,
    ): Promise<ProfileProjectResponseDto> {
        return this.profileService.createProject(user.id, body);
    }

    @Patch('projects/:itemId')
    @ZodSerializerDto(ProfileProjectResponseDto)
    updateProject(
        @CurrentUser() user: AuthUser,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() body: UpdateProjectRequestDto,
    ): Promise<ProfileProjectResponseDto> {
        return this.profileService.updateProject(user.id, itemId, body);
    }

    @Delete('projects/:itemId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteProject(@CurrentUser() user: AuthUser, @Param('itemId', ParseUUIDPipe) itemId: string): Promise<void> {
        return this.profileService.deleteProject(user.id, itemId);
    }

    @Post('education')
    @ZodSerializerDto(ProfileEducationResponseDto)
    createEducation(
        @CurrentUser() user: AuthUser,
        @Body() body: CreateEducationRequestDto,
    ): Promise<ProfileEducationResponseDto> {
        return this.profileService.createEducation(user.id, body);
    }

    @Patch('education/:itemId')
    @ZodSerializerDto(ProfileEducationResponseDto)
    updateEducation(
        @CurrentUser() user: AuthUser,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() body: UpdateEducationRequestDto,
    ): Promise<ProfileEducationResponseDto> {
        return this.profileService.updateEducation(user.id, itemId, body);
    }

    @Delete('education/:itemId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteEducation(@CurrentUser() user: AuthUser, @Param('itemId', ParseUUIDPipe) itemId: string): Promise<void> {
        return this.profileService.deleteEducation(user.id, itemId);
    }

    @Put('skills')
    @ZodSerializerDto(ReplaceProfileSkillsResponseDto)
    replaceSkills(
        @CurrentUser() user: AuthUser,
        @Body() body: ReplaceProfileSkillsRequestDto,
    ): Promise<ReplaceProfileSkillsResponseDto> {
        return this.profileService.replaceSkills(user.id, body.skills);
    }
}
