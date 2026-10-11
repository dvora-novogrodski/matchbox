import type { Application, CreateManualJob, JobMatchResponse, JobPage } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class JobsService {
    constructor(private readonly applicationsService: ApplicationsService) {}

    get(userId: string, jobId: string): Promise<JobPage> {
        return this.applicationsService.getByJob(userId, jobId);
    }

    getMatch(userId: string, jobId: string): Promise<JobMatchResponse> {
        return this.applicationsService.getMatch(userId, jobId);
    }

    createManual(userId: string, input: CreateManualJob): Promise<Application> {
        return this.applicationsService.createManual(userId, input);
    }
}
