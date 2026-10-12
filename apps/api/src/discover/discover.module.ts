import { Module } from '@nestjs/common';

import { StatusesModule } from '../statuses/statuses.module';
import { DiscoverController } from './discover.controller';
import { DiscoverRepository } from './discover.repository';
import { DiscoverService } from './discover.service';
import { PrismaDiscoverRepository } from './prisma-discover.repository';

@Module({
    imports: [StatusesModule],
    controllers: [DiscoverController],
    providers: [DiscoverService, { provide: DiscoverRepository, useClass: PrismaDiscoverRepository }],
    exports: [DiscoverService],
})
export class DiscoverModule {}
