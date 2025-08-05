import { Module } from '@nestjs/common';
import { SentenceController } from './sentence.controller';
import { SentenceService } from './sentence.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Sentence, SentenceSchema } from './sentence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sentence.name, schema: SentenceSchema, collection: 'sentences' },
    ], 'sentences')
  ],
  controllers: [SentenceController],
  providers: [SentenceService],
  exports: [SentenceService]
})
export class SentenceModule {}
