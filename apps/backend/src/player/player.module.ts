import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
