import { Module } from '@nestjs/common';
import { EventModule } from 'src/event/event.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { IdModule } from 'src/id/id.module';
import { LockModule } from 'src/lock/lock.module';
import { PlayerModule } from 'src/player/player.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { SessionService } from './session.service';

@Module({
  imports: [
    RedisModule,
    LockModule,
    PlayerModule,
    IdModule,
    GuessObjectModule,
    PrismaModule,
    EventModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService],
})
export class SessionModule {}
