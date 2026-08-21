import { Module } from '@nestjs/common';
import { ConnectionRegistryModule } from '../connection-registry/connection-registry.module';
import { EventModule } from '../event/event.module';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { IdModule } from '../id/id.module';
import { LockModule } from '../lock/lock.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { RedisModule } from '../redis/redis.module';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { SessionService } from './session.service';

@Module({
  imports: [
    RedisModule,
    LockModule,
    ConnectionRegistryModule,
    IdModule,
    GuessObjectModule,
    PrismaModule,
    EventModule,
    RateLimitModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService],
})
export class SessionModule {}
