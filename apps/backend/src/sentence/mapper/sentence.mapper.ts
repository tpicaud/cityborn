import { type Sentence, SentenceSchema } from '@cityborn/api';
import type { EndGameSentence } from '@prisma/client';

export const SentenceMapper = {
  toSentenceDto(prismaSentence: EndGameSentence): Sentence {
    return SentenceSchema.parse(prismaSentence);
  },
};
