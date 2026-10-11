import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

export class GithubRejectedError extends BadRequestException {
    constructor() {
        super('GitHub rejected the request. Check the repository and token.');
    }
}

export class GithubUnavailableError extends ServiceUnavailableException {
    constructor(cause?: unknown) {
        super('GitHub is unavailable', { cause });
    }
}
