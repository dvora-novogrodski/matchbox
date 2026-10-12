import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CvChangeResponseDto, DecideCvChangeRequestDto, SavedJobCvResponseDto, TailorResultResponseDto } from './dto/tailor.dto';
import { TailorService } from './tailor.service';

@Controller({ path: 'applications', version: '1' })
export class TailorController {
    constructor(private readonly tailorService: TailorService) {}

    @Get(':applicationId/cv-changes')
    @ZodSerializerDto(TailorResultResponseDto)
    list(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<TailorResultResponseDto> {
        return this.tailorService.list(user.id, applicationId);
    }

    @Post(':applicationId/tailor')
    @ZodSerializerDto(TailorResultResponseDto)
    tailor(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<TailorResultResponseDto> {
        return this.tailorService.tailor(user.id, applicationId);
    }

    @Patch(':applicationId/cv-changes/:changeId')
    @ZodSerializerDto(CvChangeResponseDto)
    decide(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
        @Param('changeId', ParseUUIDPipe) changeId: string,
        @Body() body: DecideCvChangeRequestDto,
    ): Promise<CvChangeResponseDto> {
        return this.tailorService.decide(user.id, applicationId, changeId, body);
    }

    @Post(':applicationId/cv-versions')
    @ZodSerializerDto(SavedJobCvResponseDto)
    save(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<SavedJobCvResponseDto> {
        return this.tailorService.save(user.id, applicationId);
    }
}
