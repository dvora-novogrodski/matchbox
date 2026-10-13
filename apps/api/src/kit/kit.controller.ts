import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Put, StreamableFile } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApplicationKitResponseDto, UpdateApplicationKitRequestDto } from './dto/kit.dto';
import { KitService } from './kit.service';

@Controller({ path: 'applications/:applicationId/kit', version: '1' })
export class KitController {
    constructor(private readonly kitService: KitService) {}

    @Get()
    @ZodSerializerDto(ApplicationKitResponseDto)
    get(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<ApplicationKitResponseDto> {
        return this.kitService.get(user.id, applicationId);
    }

    @Put()
    @ZodSerializerDto(ApplicationKitResponseDto)
    update(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
        @Body() body: UpdateApplicationKitRequestDto,
    ): Promise<ApplicationKitResponseDto> {
        return this.kitService.update(user.id, applicationId, body);
    }

    @Get('pdf')
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
    async downloadPdf(
        @CurrentUser() user: AuthUser,
        @Param('applicationId', ParseUUIDPipe) applicationId: string,
    ): Promise<StreamableFile> {
        const pdf = await this.kitService.renderPdf(user.id, applicationId);
        return new StreamableFile(pdf);
    }
}
