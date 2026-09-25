import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConnectionRegistryModule } from '../connection-registry/connection-registry.module';
import { EventModule } from '../event/event.module';
import { GameService } from '../game/game.service';
import { GameRecordModule } from '../game-record/game-record.module';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { IdModule } from '../id/id.module';
import { LockModule } from '../lock/lock.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { RedisModule } from '../redis/redis.module';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { SessionService } from './session.service';

@Module({
  imports: [
    AuthModule,
    RedisModule,
    LockModule,
    ConnectionRegistryModule,
    IdModule,
    GuessObjectModule,
    GameRecordModule,
    EventModule,
    RateLimitModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, GameService, SessionGateway],
  exports: [SessionService],
})
export class SessionModule {}
