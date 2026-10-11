import type { Application, ApplicationList, CreateManualJob, JobMatchResponse, JobPage, StatusCategory, UpdateApplication } from '@matchbox/shared';
import { JobMatchSchema } from '@matchbox/shared';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { normalizeJobUrl } from '../jobs/normalize-job-url';
import { StatusNotFoundError } from '../statuses/statuses.errors';
import { StatusesRepository } from '../statuses/statuses.repository';
import { ApplicationAlreadyExistsError, ApplicationNotFoundError, StoredMatchInvalidError } from './applications.errors';
import { toApplication, toApplicationList, toJobPage } from './applications.mapper';
import { ApplicationsRepository } from './applications.repository';
import type { ManualJobDraft } from './types/applications.types';

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

    async getMatch(userId: string, jobId: string): Promise<JobMatchResponse> {
        const lookup = await this.applicationsRepository.findMatchByJobId(userId, jobId);
        if (lookup.kind === 'not-found') {
            throw new ApplicationNotFoundError(jobId);
        }
        if (lookup.kind === 'none') {
            return { match: null };
        }

        const parsed = JobMatchSchema.safeParse({
            score: lookup.match.score,
            requirements: lookup.match.coverage,
            model: lookup.match.model,
            promptVersion: lookup.match.promptVersion,
        });
        if (!parsed.success) {
            this.logger.warn({ userId, jobId }, 'Stored match could not be read');
            throw new StoredMatchInvalidError();
        }
        return { match: parsed.data };
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

    async createManual(userId: string, input: CreateManualJob): Promise<Application> {
        const saved = await this.statusesRepository.findSystemByKey('saved');
        if (!saved) {
            throw new InternalServerErrorException('Saved status is not configured');
        }

        const now = new Date();
        const created = await this.applicationsRepository.createManual(userId, toManualJobDraft(input), saved.id, now);
        if (created.kind === 'exists') {
            throw new ApplicationAlreadyExistsError(created.jobId);
        }

        this.logger.log({ userId, jobId: created.application.job.id }, 'Manual job added');
        return toApplication(created.application);
    }
}

function toManualJobDraft(input: CreateManualJob): ManualJobDraft {
    return {
        companyName: input.companyName,
        title: input.title,
        url: emptyToNull(input.url),
        normalizedUrl: normalizeJobUrl(input.url),
        location: emptyToNull(input.location),
        workMode: input.workMode === '' ? null : input.workMode,
        description: emptyToNull(input.description),
    };
}

function emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
}
