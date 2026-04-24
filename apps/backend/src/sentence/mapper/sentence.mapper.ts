import type { ScoreType } from '@cityborn/types';
import type { EndGameSentence } from '@prisma/client';
import type { SentenceDto } from '../dto/sentence.dto';

export class SentenceMapper {
  static toSentenceDto(prismaSentence: EndGameSentence): SentenceDto {
    return {
      id: prismaSentence.id,
      score_type: prismaSentence.score_type as ScoreType,
      message: prismaSentence.message,
    };
  }
}
