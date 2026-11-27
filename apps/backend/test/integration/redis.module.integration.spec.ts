import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import type Redis from 'ioredis';
import { WideEventModule } from '../../src/common/wide-event/wide-event.module';
import { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { BackendConfigModule } from '../../src/config/config.module';
import { REDIS_CLIENT, RedisModule } from '../../src/redis/redis.module';

describe('RedisModule', () => {
  const wideEventService: WideEventService = createMock<WideEventService>();
  let module: TestingModule;
  let redisClient: Redis;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [BackendConfigModule, WideEventModule, RedisModule],
    })
      .overrideProvider(WideEventService)
      .useValue(wideEventService)
      .compile();
    await module.init();
    redisClient = module.get<Redis>(REDIS_CLIENT);
  });

  afterEach(async () => {
    if (redisClient.status !== 'end') await module.close();
  });

  describe('REDIS_CLIENT', () => {
    it('records client errors as infrastructure operation errors', async () => {
      const clientError: Error = new Error('connection lost');

      redisClient.emit('error', clientError);

      expect(await redisClient.ping()).toBe('PONG');
      expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
        clientError,
        { domain: 'infrastructure', operation: 'redis.client' },
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('quits the shared client when the module closes', async () => {
      await redisClient.ping();
      const clientEnded: Promise<void> = new Promise<void>((resolve) => {
        redisClient.once('end', resolve);
      });

      await module.close();
      await clientEnded;

      expect(redisClient.status).toBe('end');
    });
  });
});
