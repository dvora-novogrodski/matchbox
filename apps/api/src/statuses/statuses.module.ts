import { Module } from '@nestjs/common';

import { PrismaStatusesRepository } from './prisma-statuses.repository';
import { StatusesController } from './statuses.controller';
import { StatusesRepository } from './statuses.repository';
import { StatusesService } from './statuses.service';

@Module({
    controllers: [StatusesController],
    providers: [StatusesService, { provide: StatusesRepository, useClass: PrismaStatusesRepository }],
    exports: [StatusesRepository],
})
export class StatusesModule {}
