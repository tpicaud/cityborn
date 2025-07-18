import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RedisHTTPModule } from 'src/redisHTTP/redisHTTP.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { IdModule } from 'src/id/id.module';

@Module({
  imports: [RedisHTTPModule, GuessObjectModule, IdModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService]
})
export class GameModule {}
