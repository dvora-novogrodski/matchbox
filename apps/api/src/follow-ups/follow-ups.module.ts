import { Module } from '@nestjs/common';

import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsRepository } from './follow-ups.repository';
import { FollowUpsService } from './follow-ups.service';
import { PrismaFollowUpsRepository } from './prisma-follow-ups.repository';

@Module({
    controllers: [FollowUpsController],
    providers: [
        FollowUpsService,
        { provide: FollowUpsRepository, useClass: PrismaFollowUpsRepository },
    ],
    exports: [FollowUpsService],
})
export class FollowUpsModule {}
