import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StatusListResponseDto } from './dto/statuses.dto';
import { StatusesService } from './statuses.service';

@Controller({ path: 'statuses', version: '1' })
export class StatusesController {
    constructor(private readonly statusesService: StatusesService) {}

    @Get()
    @ZodSerializerDto(StatusListResponseDto)
    list(@CurrentUser() user: AuthUser): Promise<StatusListResponseDto> {
        return this.statusesService.list(user.id);
    }
}
