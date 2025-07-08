import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RedisModule } from 'src/redis/redis.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { IdService } from 'src/id/id.service';

@Module({
  imports: [RedisModule, GuessObjectModule, IdService],
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule {}
