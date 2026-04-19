import { Module } from '@nestjs/common';
import { IdService } from './id.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [IdService],
  exports: [IdService],
})
export class IdModule {}
