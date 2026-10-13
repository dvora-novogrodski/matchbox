import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import type { AuthUser } from '../auth/types/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TodayResponseDto } from './dto/today.dto';
import { TodayService } from './today.service';

@Controller({ path: 'today', version: '1' })
export class TodayController {
    constructor(private readonly todayService: TodayService) {}

    @Get()
    @ZodSerializerDto(TodayResponseDto)
    get(@CurrentUser() user: AuthUser): Promise<TodayResponseDto> {
        return this.todayService.get(user.id);
    }
}
