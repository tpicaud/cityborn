import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CONFIG, type RedisConfig } from '../config/config.module';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [REDIS_CONFIG],
      useFactory: (redisConfig: RedisConfig): Redis => {
        return new Redis(redisConfig.url);
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
