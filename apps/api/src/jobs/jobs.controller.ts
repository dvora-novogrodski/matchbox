import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JobPageResponseDto } from './dto/jobs.dto';
import { JobsService } from './jobs.service';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Get(':jobId')
    @ZodSerializerDto(JobPageResponseDto)
    get(@CurrentUser() user: AuthUser, @Param('jobId', ParseUUIDPipe) jobId: string): Promise<JobPageResponseDto> {
        return this.jobsService.get(user.id, jobId);
    }
}
