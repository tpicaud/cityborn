import { Module } from '@nestjs/common';
import { IdService } from './id.service';
import { RedisHTTPModule } from 'src/redisHTTP/redisHTTP.module';

@Module({
  imports: [RedisHTTPModule],
  providers: [IdService],
  exports: [IdService]
})
export class IdModule {}
