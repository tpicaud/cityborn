import { Controller, Get, Query } from '@nestjs/common';
import { SentenceService } from './sentence.service';
import { SentenceDto } from './dto/sentence.dto';
import { ScoreType } from '@cityborn/types';

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
