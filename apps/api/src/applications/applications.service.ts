import type { Application, ApplicationList, JobPage, StatusCategory, UpdateApplication } from '@matchbox/shared';
import { Injectable, Logger } from '@nestjs/common';

import { StatusNotFoundError } from '../statuses/statuses.errors';
import { StatusesRepository } from '../statuses/statuses.repository';
import { ApplicationNotFoundError } from './applications.errors';
import { toApplication, toApplicationList, toJobPage } from './applications.mapper';
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

    async getByJob(userId: string, jobId: string): Promise<JobPage> {
        const page = await this.applicationsRepository.findPageByJobId(userId, jobId);
        if (!page) {
            throw new ApplicationNotFoundError(jobId);
        }
        return toJobPage(page);
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

    async updateDetails(userId: string, applicationId: string, input: UpdateApplication): Promise<Application> {
        const current = await this.applicationsRepository.findById(userId, applicationId);
        if (!current) {
            throw new ApplicationNotFoundError(applicationId);
        }

        const recruiterName = emptyToNull(input.recruiterName);
        const recruiterContact = emptyToNull(input.recruiterContact);
        const notes = emptyToNull(input.notes);
        const notesChanged = notes !== current.notes;
        const detailsChanged =
            recruiterName !== current.recruiterName || recruiterContact !== current.recruiterContact || notesChanged;
        if (!detailsChanged) {
            return toApplication(current);
        }

        const now = new Date();
        const updated = await this.applicationsRepository.updateDetails(userId, applicationId, {
            recruiterName,
            recruiterContact,
            notes,
            lastActivityAt: now,
            note: notesChanged && notes !== null ? { text: notes, occurredAt: now } : null,
        });
        if (!updated) {
            throw new ApplicationNotFoundError(applicationId);
        }

        this.logger.log({ userId, applicationId }, 'Application details updated');
        return toApplication(updated);
    }
}

function emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
}
