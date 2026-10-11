import { ConflictException, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export class ApplicationNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super(`Application ${applicationId} not found`);
    }
}

export class MatchUnavailableError extends ServiceUnavailableException {
    constructor() {
        super({
            code: 'AI_UNAVAILABLE',
            message: 'Match analysis is unavailable',
        });
    }
}

export class StoredMatchInvalidError extends InternalServerErrorException {
    constructor() {
        super({
            code: 'MATCH_DATA_INVALID',
            message: 'Stored match could not be read',
        });
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
