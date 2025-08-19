import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './session/session.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SentenceModule } from './sentence/sentence.module';
import { GuessObjectModule } from './guess-object/guess-object.module';
import { GameModule } from './game/game.module';
import { IdModule } from './id/id.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { LockModule } from './lock/lock.module';
import { PlayerModule } from './player/player.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_GUESS_OBJECTS_URI || 'mongodb://localhost/nest', {
      connectionName: 'guessObjects'
    }),
    MongooseModule.forRoot(process.env.MONGODB_SENTENCES_URI || 'mongodb://localhost/nest', {
      connectionName: 'sentences'
    }),
    MongooseModule.forRoot(process.env.MONGODB_GAMES_URI || 'mongodb://localhost/nest', {
      connectionName: 'games'
    }),
    SentenceModule,
    SessionModule,
    SentenceModule,
    GuessObjectModule,
    GameModule,
    IdModule,
    RedisModule,
    LockModule,
    PlayerModule,
    AuthModule,
    PrismaModule,
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
