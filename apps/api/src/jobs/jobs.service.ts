import type { JobPage } from '@matchbox/shared';
import { Injectable } from '@nestjs/common';

import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class JobsService {
    constructor(private readonly applicationsService: ApplicationsService) {}

    get(userId: string, jobId: string): Promise<JobPage> {
        return this.applicationsService.getByJob(userId, jobId);
    }
}
