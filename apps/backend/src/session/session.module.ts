import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionGateway } from './session.gateway';
import { LockModule } from 'src/lock/lock.module';
import { RedisModule } from 'src/redis/redis.module';
import { PlayerModule } from 'src/player/player.module';
import { IdModule } from 'src/id/id.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';

@Module({
  imports: [RedisModule, LockModule, PlayerModule, IdModule, GuessObjectModule],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService]
})
export class SessionModule {}
