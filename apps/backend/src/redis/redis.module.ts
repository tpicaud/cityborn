import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { REDIS_CONFIG, type RedisConfig } from '../config/config.module';

export const REDIS_CLIENT: symbol = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [REDIS_CONFIG, WideEventService],
      useFactory: (
        redisConfig: RedisConfig,
        wideEventService: WideEventService,
      ): Redis => {
        const redisClient: Redis = new Redis(redisConfig.url);
        redisClient.on('error', (err) => {
          wideEventService.recordOperationError(err, {
            domain: 'infrastructure',
            operation: 'redis.client',
          });
        });
        return redisClient;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }
}
