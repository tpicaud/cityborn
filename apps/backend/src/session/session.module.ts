import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionGateway } from './session.gateway';
import { LockModule } from 'src/lock/lock.module';
import { RedisModule } from 'src/redis/redis.module';
import { PlayerModule } from 'src/player/player.module';
import { GameModule } from 'src/game/game.module';
import { IdModule } from 'src/id/id.module';

@Module({
  imports: [RedisModule, LockModule, PlayerModule, GameModule, IdModule],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService]
})
export class SessionModule {}
