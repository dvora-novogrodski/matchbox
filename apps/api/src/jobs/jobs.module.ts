import { Module } from '@nestjs/common';

import { ApplicationsModule } from '../applications/applications.module';
import { DiscoverModule } from '../discover/discover.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
    imports: [ApplicationsModule, DiscoverModule],
    controllers: [JobsController],
    providers: [JobsService],
})
export class JobsModule {}
