import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ConnectionRegistryService } from './connection-registry.service';
import {
  CONNECTION_REGISTRY_TIMING,
  connectionRegistryTiming,
} from './connection-registry-timing';

@Module({
  imports: [RedisModule],
  providers: [
    { provide: CONNECTION_REGISTRY_TIMING, useValue: connectionRegistryTiming },
    ConnectionRegistryService,
  ],
  exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}
