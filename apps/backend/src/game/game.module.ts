import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RedisModule } from 'src/redis/redis.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';

@Module({
  imports: [RedisModule, GuessObjectModule],
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule {}
