import { ScoreType, Sentence } from '@cityborn/api';
import type { EndGameSentence } from '@prisma/client';

export const SentenceMapper = {
  toSentenceDto(prismaSentence: EndGameSentence): Sentence {
    return {
      id: prismaSentence.id,
      score_type: prismaSentence.score_type as ScoreType,
      message: prismaSentence.message,
    };
  },
};
