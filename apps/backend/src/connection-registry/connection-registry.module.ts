import { Module } from '@nestjs/common';
import { SESSION_CONFIG } from '../config/config.module';
import { RedisModule } from '../redis/redis.module';
import { ConnectionRegistryService } from './connection-registry.service';
import {
  CONNECTION_REGISTRY_TIMING,
  createConnectionRegistryTiming,
} from './connection-registry-timing';

@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: CONNECTION_REGISTRY_TIMING,
      inject: [SESSION_CONFIG],
      useFactory: createConnectionRegistryTiming,
    },
    ConnectionRegistryService,
  ],
  exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}
