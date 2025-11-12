import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './session/session.module';
import { SentenceModule } from './sentence/sentence.module';
import { GuessObjectModule } from './guess-object/guess-object.module';
import { IdModule } from './id/id.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { LockModule } from './lock/lock.module';
import { PlayerModule } from './player/player.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { EventModule } from './event/event.module';
import { WikidataModule } from './wikidata/wikidata.module';
import { NominatimModule } from './nominatim/nominatim.module';
import { WorldLocationModule } from './world-location/world-location.module';
import { CategoryModule } from './category/category.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SentenceModule,
    SessionModule,
    SentenceModule,
    GuessObjectModule,
    IdModule,
    RedisModule,
    LockModule,
    PlayerModule,
    AuthModule,
    PrismaModule,
    UserModule,
    MailModule,
    EventModule,
    WikidataModule,
    NominatimModule,
    WorldLocationModule,
    CategoryModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
