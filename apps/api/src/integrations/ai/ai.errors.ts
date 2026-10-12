import { ServiceUnavailableException } from '@nestjs/common';

export class TailorUnavailableError extends ServiceUnavailableException {
    constructor() {
        super({
            code: 'AI_UNAVAILABLE',
            message: 'CV tailoring is unavailable',
        });
    }
}
