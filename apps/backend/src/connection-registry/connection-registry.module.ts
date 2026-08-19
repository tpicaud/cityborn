import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ConnectionRegistryService } from './connection-registry.service';

@Module({
  imports: [RedisModule],
  providers: [ConnectionRegistryService],
  exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}
