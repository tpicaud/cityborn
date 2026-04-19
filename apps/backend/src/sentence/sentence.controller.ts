import type { ScoreType } from '@cityborn/types';
import { Controller, Get, Query } from '@nestjs/common';
import type { SentenceDto } from './dto/sentence.dto';
import type { SentenceService } from './sentence.service';

@Controller('sentence')
export class SentenceController {
  constructor(private readonly sentenceService: SentenceService) {}

  @Get()
  async getSentence(
    @Query('score_type') score_type: ScoreType,
  ): Promise<SentenceDto> {
    return await this.sentenceService.findRandomOne(score_type);
  }
}
