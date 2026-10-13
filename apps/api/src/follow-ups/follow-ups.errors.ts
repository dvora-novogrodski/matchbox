import { NotFoundException } from '@nestjs/common';

export class FollowUpNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super({
            code: 'FOLLOW_UP_NOT_FOUND',
            message: 'This application was not found',
            applicationId,
        });
    }
}
