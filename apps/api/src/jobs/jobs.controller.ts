import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatedApplicationResponseDto, CreateManualJobRequestDto, JobPageResponseDto } from './dto/jobs.dto';
import { JobsService } from './jobs.service';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

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
}
