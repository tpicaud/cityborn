import { ErrorCode, type ScoreType, type Sentence } from '@cityborn/api';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SENTENCE_REPOSITORY,
  type SentenceRepository,
} from './repositories/sentence.repository';

@Injectable()
export class SentenceService {
  constructor(
    @Inject(SENTENCE_REPOSITORY)
    private readonly sentenceRepository: SentenceRepository,
  ) {}

  async findRandomOne(score_type: ScoreType): Promise<Sentence> {
    const sentences = await this.sentenceRepository.findByScoreType(score_type);

    if (sentences.length === 0) {
      throw new NotFoundException({
        code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND,
        message: 'Sentence not found',
      });
    }

    const randomIndex = Math.floor(Math.random() * sentences.length);
    const randomSentence = sentences[randomIndex];

    return randomSentence;
  }
}
