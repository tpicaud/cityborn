import { Global, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
