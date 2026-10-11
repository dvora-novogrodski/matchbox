import { Module } from '@nestjs/common';

import { StatusesModule } from '../statuses/statuses.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { PrismaApplicationsRepository } from './prisma-applications.repository';

@Module({
    imports: [StatusesModule],
    controllers: [ApplicationsController],
    providers: [
        ApplicationsService,
        { provide: ApplicationsRepository, useClass: PrismaApplicationsRepository },
    ],
})
export class ApplicationsModule {}
