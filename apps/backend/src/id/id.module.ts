import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { IdService } from './id.service';

@Module({
  imports: [RedisModule],
  providers: [IdService],
  exports: [IdService],
})
export class IdModule {}
