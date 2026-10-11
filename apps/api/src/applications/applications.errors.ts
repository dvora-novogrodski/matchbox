import { NotFoundException } from '@nestjs/common';

export class ApplicationNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super(`Application ${applicationId} not found`);
    }
}
