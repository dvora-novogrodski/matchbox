import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Post, Put, StreamableFile } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CvService } from './cv.service';
import {
    ConnectGithubRequestDto,
    CvEditorResponseDto,
    CvVersionResponseDto,
    GithubConnectionResponseDto,
    SaveBaseCvRequestDto,
} from './dto/cv.dto';

@Controller({ path: 'cv', version: '1' })
export class CvController {
    constructor(private readonly cvService: CvService) {}

    @Get()
    @ZodSerializerDto(CvEditorResponseDto)
    getBaseCv(@CurrentUser() user: AuthUser): Promise<CvEditorResponseDto> {
        return this.cvService.getEditor(user.id);
    }

    @Put()
    @ZodSerializerDto(CvEditorResponseDto)
    saveBaseCv(@CurrentUser() user: AuthUser, @Body() body: SaveBaseCvRequestDto): Promise<CvEditorResponseDto> {
        return this.cvService.saveBaseCv(user.id, body);
    }

    @Get('pdf')
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
    async downloadPdf(@CurrentUser() user: AuthUser): Promise<StreamableFile> {
        const pdf = await this.cvService.renderPdf(user.id);
        return new StreamableFile(pdf);
    }

    @Post('versions')
    @ZodSerializerDto(CvVersionResponseDto)
    saveVersion(@CurrentUser() user: AuthUser): Promise<CvVersionResponseDto> {
        return this.cvService.saveBaseVersion(user.id);
    }

    @Put('github')
    @ZodSerializerDto(GithubConnectionResponseDto)
    connectGithub(
        @CurrentUser() user: AuthUser,
        @Body() body: ConnectGithubRequestDto,
    ): Promise<GithubConnectionResponseDto> {
        return this.cvService.connectGithub(user.id, body);
    }

    @Delete('github')
    @HttpCode(HttpStatus.NO_CONTENT)
    disconnectGithub(@CurrentUser() user: AuthUser): Promise<void> {
        return this.cvService.disconnectGithub(user.id);
    }
}
