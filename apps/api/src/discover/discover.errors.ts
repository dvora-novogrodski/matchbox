import { ConflictException, NotFoundException } from '@nestjs/common';

export class DiscoverJobNotFoundError extends NotFoundException {
    constructor(jobId: string) {
        super({
            code: 'DISCOVER_JOB_NOT_FOUND',
            message: 'This job is not in your review queue',
            jobId,
        });
    }
}

export class DiscoverJobSkippedError extends ConflictException {
    constructor(jobId: string) {
        super({
            code: 'DISCOVER_JOB_SKIPPED',
            message: 'This job was already skipped',
            jobId,
        });
    }
}

export class DiscoverJobAlreadySavedError extends ConflictException {
    constructor(jobId: string) {
        super({
            code: 'DISCOVER_JOB_ALREADY_SAVED',
            message: 'This job is already in your pipeline',
            jobId,
        });
    }
}

export class DiscoverPostingIncompleteError extends ConflictException {
    constructor(jobId: string) {
        super({
            code: 'DISCOVER_POSTING_INCOMPLETE',
            message: 'This job is missing a title or company',
            jobId,
        });
    }
}
