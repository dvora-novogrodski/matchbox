import { NotFoundException } from '@nestjs/common';

export class StatusNotFoundError extends NotFoundException {
    constructor(statusId: string) {
        super(`Status ${statusId} not found`);
    }
}
