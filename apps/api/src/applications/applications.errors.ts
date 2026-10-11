import { ConflictException, NotFoundException } from '@nestjs/common';

export class ApplicationNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super(`Application ${applicationId} not found`);
    }
}

export class ApplicationAlreadyExistsError extends ConflictException {
    constructor(jobId: string) {
        super({
            code: 'APPLICATION_ALREADY_EXISTS',
            message: 'This job is already in your pipeline',
            jobId,
        });
    }
}
