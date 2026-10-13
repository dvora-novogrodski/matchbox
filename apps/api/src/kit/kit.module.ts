import { Module } from '@nestjs/common';

import { CvModule } from '../cv/cv.module';
import { KitController } from './kit.controller';
import { KitRepository } from './kit.repository';
import { KitService } from './kit.service';
import { PrismaKitRepository } from './prisma-kit.repository';

@Module({
    imports: [CvModule],
    controllers: [KitController],
    providers: [KitService, { provide: KitRepository, useClass: PrismaKitRepository }],
})
export class KitModule {}
