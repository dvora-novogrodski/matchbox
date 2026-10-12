import type { Application, DiscoverList } from '@matchbox/shared';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { StatusesRepository } from '../statuses/statuses.repository';
import {
    DiscoverJobAlreadySavedError,
    DiscoverJobNotFoundError,
    DiscoverJobSkippedError,
    DiscoverPostingIncompleteError,
} from './discover.errors';
import { toSavedApplication } from './discover.mapper';
import { DiscoverRepository } from './discover.repository';

@Injectable()
export class DiscoverService {
    private readonly logger = new Logger(DiscoverService.name);

    constructor(
        private readonly discoverRepository: DiscoverRepository,
        private readonly statusesRepository: StatusesRepository,
    ) {}

    async list(userId: string): Promise<DiscoverList> {
        const items = await this.discoverRepository.listPending(userId);
        return { items };
    }

    async save(userId: string, jobId: string): Promise<Application> {
        const saved = await this.statusesRepository.findSystemByKey('saved');
        if (!saved) {
            throw new InternalServerErrorException('Saved status is not configured');
        }

        const result = await this.discoverRepository.save(userId, jobId, saved.id, new Date());
        if (result.kind === 'missing') {
            throw new DiscoverJobNotFoundError(jobId);
        }
        if (result.kind === 'skipped') {
            throw new DiscoverJobSkippedError(jobId);
        }
        if (result.kind === 'incomplete') {
            throw new DiscoverPostingIncompleteError(jobId);
        }

        this.logger.log({ userId, jobId, applicationId: result.application.id }, 'Discovered job saved');
        return toSavedApplication(result.application);
    }

    async skip(userId: string, jobId: string): Promise<void> {
        const result = await this.discoverRepository.skip(userId, jobId, new Date());
        if (result.kind === 'missing') {
            throw new DiscoverJobNotFoundError(jobId);
        }
        if (result.kind === 'saved') {
            throw new DiscoverJobAlreadySavedError(jobId);
        }
        this.logger.log({ userId, jobId }, 'Discovered job skipped');
    }
}
