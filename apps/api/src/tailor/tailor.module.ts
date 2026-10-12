import { Module } from '@nestjs/common';

import { CvModule } from '../cv/cv.module';
import { AiModule } from '../integrations/ai/ai.module';
import { ProfileModule } from '../profile/profile.module';
import { PrismaTailorRepository } from './prisma-tailor.repository';
import { TailorController } from './tailor.controller';
import { TailorRepository } from './tailor.repository';
import { TailorService } from './tailor.service';

@Module({
    imports: [CvModule, ProfileModule, AiModule],
    controllers: [TailorController],
    providers: [TailorService, { provide: TailorRepository, useClass: PrismaTailorRepository }],
})
export class TailorModule {}
