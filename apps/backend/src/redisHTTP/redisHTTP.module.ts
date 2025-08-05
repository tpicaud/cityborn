import { Module } from '@nestjs/common';
import { RedisHTTPService } from './redisHTTP.service';

@Module({
  providers: [RedisHTTPService],
  exports: [RedisHTTPService]
})
export class RedisHTTPModule {}
