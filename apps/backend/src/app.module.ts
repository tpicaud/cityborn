import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './session/session.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SentenceModule } from './sentence/sentence.module';
import { GuessObjectModule } from './guess-object/guess-object.module';
import { RedisHTTPModule } from './redisHTTP/redisHTTP.module';
import { GameModule } from './game/game.module';
import { IdModule } from './id/id.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { LockModule } from './lock/lock.module';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/nest'),
    SentenceModule,
    SessionModule,
    SentenceModule,
    GuessObjectModule,
    RedisHTTPModule,
    GameModule,
    IdModule,
    RedisModule,
    LockModule,
    PlayerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
