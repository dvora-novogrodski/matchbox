import { NotFoundException } from '@nestjs/common';

export class KitNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super({
            code: 'KIT_NOT_FOUND',
            message: 'This application was not found',
            applicationId,
        });
    }
}
