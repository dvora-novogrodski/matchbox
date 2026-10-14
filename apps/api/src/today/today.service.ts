import type { Today } from '@matchbox/shared';
import { Inject, Injectable } from '@nestjs/common';

import { DiscoverService } from '../discover/discover.service';
import { FollowUpsService } from '../follow-ups/follow-ups.service';
import { toTodayApplication } from './today.mapper';
import { TodayRepository } from './today.repository';

@Injectable()
export class TodayService {
    constructor(
        private readonly todayRepository: TodayRepository,
        @Inject(DiscoverService) private readonly discoverService: Pick<DiscoverService, 'list'>,
        @Inject(FollowUpsService) private readonly followUpsService: Pick<FollowUpsService, 'list'>,
    ) {}

    async get(userId: string): Promise<Today> {
        const [discover, toTailor, followUps, inProgress] = await Promise.all([
            this.discoverService.list(userId),
            this.todayRepository.listWithoutTailoredCv(userId),
            this.followUpsService.list(userId),
            this.todayRepository.countInProgress(userId),
        ]);
        const matches = discover.items.map((item) => ({
            jobId: item.jobId,
            title: item.title,
            companyName: item.companyName,
            jobUrl: item.url,
            score: item.score,
        }));
        return {
            matches,
            toTailor: toTailor.map(toTodayApplication),
            followUps: followUps.items,
            stats: {
                matches: matches.length,
                toTailor: toTailor.length,
                followUps: followUps.items.length,
                inProgress,
            },
        };
    }
}
