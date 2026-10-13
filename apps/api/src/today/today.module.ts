import { Module } from '@nestjs/common';

import { DiscoverModule } from '../discover/discover.module';
import { FollowUpsModule } from '../follow-ups/follow-ups.module';
import { PrismaTodayRepository } from './prisma-today.repository';
import { TodayController } from './today.controller';
import { TodayRepository } from './today.repository';
import { TodayService } from './today.service';

@Module({
    imports: [DiscoverModule, FollowUpsModule],
    controllers: [TodayController],
    providers: [
        TodayService,
        { provide: TodayRepository, useClass: PrismaTodayRepository },
    ],
})
export class TodayModule {}
