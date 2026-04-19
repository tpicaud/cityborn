import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SentenceController } from './sentence.controller';
import { SentenceService } from './sentence.service';

@Module({
  imports: [PrismaModule],
  controllers: [SentenceController],
  providers: [SentenceService],
  exports: [SentenceService],
})
export class SentenceModule {}
