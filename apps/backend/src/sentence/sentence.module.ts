import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { PrismaSentenceRepository } from './repositories/prisma-sentence.repository';
import { SENTENCE_REPOSITORY } from './repositories/sentence.repository';
import { SentenceController } from './sentence.controller';
import { SentenceService } from './sentence.service';

@Module({
  imports: [PrismaClsModule],
  controllers: [SentenceController],
  providers: [
    SentenceService,
    { provide: SENTENCE_REPOSITORY, useClass: PrismaSentenceRepository },
  ],
  exports: [SentenceService],
})
export class SentenceModule {}
