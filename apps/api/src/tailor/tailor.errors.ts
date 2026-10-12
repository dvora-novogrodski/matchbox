import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class TailorApplicationNotFoundError extends NotFoundException {
    constructor(applicationId: string) {
        super(`Application ${applicationId} not found`);
    }
}

export class CvChangeNotFoundError extends NotFoundException {
    constructor(changeId: string) {
        super(`CV change ${changeId} not found`);
    }
}

export class BlockedCvChangeError extends BadRequestException {
    constructor() {
        super('A blocked change cannot be accepted or rejected');
    }
}

export class NothingToSaveError extends BadRequestException {
    constructor() {
        super('Accept a change before saving a version');
    }
}

export class DraftAlreadyClosedError extends ConflictException {
    constructor() {
        super('This draft was already saved or closed.');
    }
}

export class CvChangeApplyFailedError extends BadRequestException {
    constructor() {
        super('An accepted change could not be applied');
    }
}
