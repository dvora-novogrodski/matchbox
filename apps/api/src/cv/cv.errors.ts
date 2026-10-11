import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export class CvItemNotFoundError extends NotFoundException {
    constructor(itemId: string) {
        super(`CV item ${itemId} not found`);
    }
}

export class CvUserNotFoundError extends NotFoundException {
    constructor() {
        super('User not found');
    }
}

export class UnknownCvTemplateError extends BadRequestException {
    constructor(templateId: string) {
        super(`CV template ${templateId} is not available`);
    }
}

export class CvPdfUnavailableError extends ServiceUnavailableException {
    constructor(cause?: unknown) {
        super('CV PDF rendering is unavailable', { cause });
    }
}

export class TokenEncryptionUnavailableError extends ServiceUnavailableException {
    constructor() {
        super('Token encryption is not configured');
    }
}

export class CvGithubCredentialsError extends BadRequestException {
    constructor() {
        super('The stored GitHub connection could not be used. Connect the repository again.');
    }
}
