import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FollowUpListResponseDto } from './dto/follow-ups.dto';
import { FollowUpsService } from './follow-ups.service';

@Controller({ version: '1' })
export class FollowUpsController {
    constructor(private readonly followUpsService: FollowUpsService) {}

    @Get('follow-ups')
    @ZodSerializerDto(FollowUpListResponseDto)
    list(@CurrentUser() user: AuthUser): Promise<FollowUpListResponseDto> {
        return this.followUpsService.list(user.id);
    }

    @Post('applications/:applicationId/follow-ups')
    @HttpCode(204)
    record(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<void> {
        return this.followUpsService.record(user.id, applicationId);
    }
}
