import type { Application, ApplicationList, StatusCategory } from '@matchbox/shared';
import { Injectable, Logger } from '@nestjs/common';

import { StatusNotFoundError } from '../statuses/statuses.errors';
import { StatusesRepository } from '../statuses/statuses.repository';
import { ApplicationNotFoundError } from './applications.errors';
import { toApplication, toApplicationList } from './applications.mapper';
import { ApplicationsRepository } from './applications.repository';

const CATEGORIES_THAT_RECORD_APPLIED = new Set<StatusCategory>(['active', 'interviewing', 'offer']);

@Injectable()
export class ApplicationsService {
    private readonly logger = new Logger(ApplicationsService.name);

    constructor(
        private readonly applicationsRepository: ApplicationsRepository,
        private readonly statusesRepository: StatusesRepository,
    ) {}

    async list(userId: string): Promise<ApplicationList> {
        const applications = await this.applicationsRepository.list(userId);
        return toApplicationList(applications);
    }

    async changeStatus(userId: string, applicationId: string, statusId: string): Promise<Application> {
        const current = await this.applicationsRepository.findById(userId, applicationId);
        if (!current) {
            throw new ApplicationNotFoundError(applicationId);
        }

        const status = await this.statusesRepository.findVisible(userId, statusId);
        if (!status) {
            throw new StatusNotFoundError(statusId);
        }

        if (current.status.id === status.id) {
            return toApplication(current);
        }

        const now = new Date();
        const updated = await this.applicationsRepository.changeStatus(userId, applicationId, {
            fromStatusId: current.status.id,
            statusId: status.id,
            appliedAt: current.appliedAt ?? (CATEGORIES_THAT_RECORD_APPLIED.has(status.category) ? now : null),
            lastActivityAt: now,
            occurredAt: now,
        });
        if (!updated) {
            throw new ApplicationNotFoundError(applicationId);
        }

        this.logger.log({ userId, applicationId, statusId: status.id }, 'Application status changed');
        return toApplication(updated);
    }
}
