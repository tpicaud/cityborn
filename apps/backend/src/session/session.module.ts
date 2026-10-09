import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { GameService } from '../game/game.service';
import { GameRecordModule } from '../game-record/game-record.module';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { IdModule } from '../id/id.module';
import { LockModule } from '../lock/lock.module';
import { RedisModule } from '../redis/redis.module';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { SessionService } from './session.service';
import {
  SESSION_PRESENCE_TIMING,
  sessionPresenceTiming,
} from './session-presence-timing';

@Module({
  imports: [
    RedisModule,
    LockModule,
    IdModule,
    GuessObjectModule,
    GameRecordModule,
    EventModule,
  ],
  controllers: [SessionController],
  providers: [
    { provide: SESSION_PRESENCE_TIMING, useValue: sessionPresenceTiming },
    SessionService,
    GameService,
    SessionGateway,
  ],
  exports: [SessionService],
})
export class SessionModule {}
