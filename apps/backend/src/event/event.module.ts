import { Global, Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { EventService } from './event.service';
import { EVENT_REPOSITORY } from './repositories/event.repository';
import { PrismaEventRepository } from './repositories/prisma-event.repository';

@Global()
@Module({
  imports: [PrismaClsModule],
  providers: [
    EventService,
    { provide: EVENT_REPOSITORY, useClass: PrismaEventRepository },
  ],
  exports: [EventService],
})
export class EventModule {}
