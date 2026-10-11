import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import {
    ApplicationListResponseDto,
    ApplicationResponseDto,
    ChangeApplicationStatusRequestDto,
    UpdateApplicationRequestDto,
} from './dto/applications.dto';

@Controller({ path: 'applications', version: '1' })
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    @Get()
    @ZodSerializerDto(ApplicationListResponseDto)
    list(@CurrentUser() user: AuthUser): Promise<ApplicationListResponseDto> {
        return this.applicationsService.list(user.id);
    }

    @Patch(':applicationId/status')
    @ZodSerializerDto(ApplicationResponseDto)
    changeStatus(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
        @Body() body: ChangeApplicationStatusRequestDto,
    ): Promise<ApplicationResponseDto> {
        return this.applicationsService.changeStatus(user.id, applicationId, body.statusId);
    }

    @Patch(':applicationId')
    @ZodSerializerDto(ApplicationResponseDto)
    update(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
        @Body() body: UpdateApplicationRequestDto,
    ): Promise<ApplicationResponseDto> {
        return this.applicationsService.updateDetails(user.id, applicationId, body);
    }
}
