import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { loggerModuleParams } from './common/logger/logger.params';
import { WideEventModule } from './common/wide-event/wide-event.module';
import { ConnectionRegistryModule } from './connection-registry/connection-registry.module';
import { EventModule } from './event/event.module';
import { GuessObjectModule } from './guess-object/guess-object.module';
import { HealthModule } from './health/health.module';
import { IdModule } from './id/id.module';
import { LockModule } from './lock/lock.module';
import { NominatimModule } from './nominatim/nominatim.module';
import { PrismaModule } from './prisma/prisma.module';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';
import { SentenceModule } from './sentence/sentence.module';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { WikidataModule } from './wikidata/wikidata.module';
import { WorldLocationModule } from './world-location/world-location.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot(loggerModuleParams),
    WideEventModule,
    SentenceModule,
    SessionModule,
    GuessObjectModule,
    HealthModule,
    IdModule,
    RedisModule,
    LockModule,
    ConnectionRegistryModule,
    AuthModule,
    PrismaModule,
    UserModule,
    EventModule,
    WikidataModule,
    NominatimModule,
    WorldLocationModule,
    CategoryModule,
    SearchModule,
    RateLimitModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
