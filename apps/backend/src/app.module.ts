import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './session/session.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SentenceModule } from './sentence/sentence.module';
import { GuessObjectModule } from './guess-object/guess-object.module';
import { RedisModule } from './redis/redis.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/nest'),
    SentenceModule,
    SessionModule,
    SentenceModule,
    GuessObjectModule,
    RedisModule,
    GameModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
