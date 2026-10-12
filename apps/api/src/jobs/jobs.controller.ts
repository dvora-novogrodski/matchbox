import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DiscoverService } from '../discover/discover.service';
import { CreatedApplicationResponseDto, CreateManualJobRequestDto, JobMatchResponseDto, JobPageResponseDto } from './dto/jobs.dto';
import { JobsService } from './jobs.service';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
    constructor(
        private readonly jobsService: JobsService,
        private readonly discoverService: DiscoverService,
    ) {}

    @Get(':jobId/match')
    @ZodSerializerDto(JobMatchResponseDto)
    getMatch(@CurrentUser() user: AuthUser, @Param('jobId', ParseUUIDPipe) jobId: string): Promise<JobMatchResponseDto> {
        return this.jobsService.getMatch(user.id, jobId);
    }

    @Get(':jobId')
    @ZodSerializerDto(JobPageResponseDto)
    get(@CurrentUser() user: AuthUser, @Param('jobId', ParseUUIDPipe) jobId: string): Promise<JobPageResponseDto> {
        return this.jobsService.get(user.id, jobId);
    }

    @Post()
    @ZodSerializerDto(CreatedApplicationResponseDto)
    create(@CurrentUser() user: AuthUser, @Body() body: CreateManualJobRequestDto): Promise<CreatedApplicationResponseDto> {
        return this.jobsService.createManual(user.id, body);
    }

    @Post(':jobId/save')
    @HttpCode(HttpStatus.OK)
    @ZodSerializerDto(CreatedApplicationResponseDto)
    save(@CurrentUser() user: AuthUser, @Param('jobId', ParseUUIDPipe) jobId: string): Promise<CreatedApplicationResponseDto> {
        return this.discoverService.save(user.id, jobId);
    }

    @Post(':jobId/skip')
    @HttpCode(HttpStatus.NO_CONTENT)
    skip(@CurrentUser() user: AuthUser, @Param('jobId', ParseUUIDPipe) jobId: string): Promise<void> {
        return this.discoverService.skip(user.id, jobId);
    }
}
