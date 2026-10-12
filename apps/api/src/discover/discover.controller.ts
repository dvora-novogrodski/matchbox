import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DiscoverService } from './discover.service';
import { DiscoverListResponseDto } from './dto/discover.dto';

@Controller({ path: 'discover', version: '1' })
export class DiscoverController {
    constructor(private readonly discoverService: DiscoverService) {}

    @Get()
    @ZodSerializerDto(DiscoverListResponseDto)
    list(@CurrentUser() user: AuthUser): Promise<DiscoverListResponseDto> {
        return this.discoverService.list(user.id);
    }
}
