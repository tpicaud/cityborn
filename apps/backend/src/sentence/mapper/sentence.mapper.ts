import { Sentence } from '@cityborn/api';
import type { ScoreType } from '@cityborn/types';
import type { EndGameSentence } from '@prisma/client';

export class SentenceMapper {
  static toSentenceDto(prismaSentence: EndGameSentence): Sentence {
    return {
      id: prismaSentence.id,
      score_type: prismaSentence.score_type as ScoreType,
      message: prismaSentence.message,
    };
  }
}
