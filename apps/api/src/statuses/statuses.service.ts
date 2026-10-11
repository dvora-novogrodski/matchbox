import type { StatusList } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { toStatusList } from './statuses.mapper';
import { StatusesRepository } from './statuses.repository';

@Injectable()
export class StatusesService {
    constructor(private readonly statusesRepository: StatusesRepository) {}

    async list(userId: string): Promise<StatusList> {
        const statuses = await this.statusesRepository.listVisible(userId);
        return toStatusList(statuses);
    }
}
