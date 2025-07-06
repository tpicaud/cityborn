import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './session/session.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SentenceModule } from './sentence/sentence.module';

@Module({
  imports: [
    SentenceModule,
    SessionModule,
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/nest'),
    SentenceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
