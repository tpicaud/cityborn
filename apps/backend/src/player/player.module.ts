import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { PlayerService } from './player.service';

@Module({
  imports: [RedisModule],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
