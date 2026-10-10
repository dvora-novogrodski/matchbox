import { NotFoundException } from '@nestjs/common';

export class ProfileItemNotFoundError extends NotFoundException {
    constructor(itemId: string) {
        super(`Profile item ${itemId} not found`);
    }
}

export class ProfileBulletNotFoundError extends NotFoundException {
    constructor(bulletId: string) {
        super(`Profile bullet ${bulletId} not found`);
    }
}
