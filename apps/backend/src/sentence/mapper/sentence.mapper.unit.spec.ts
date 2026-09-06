import { ScoreType } from '@cityborn/api';
import type { EndGameSentence as PrismaEndGameSentence } from '@prisma/client';
import { SentenceMapper } from './sentence.mapper';

const prismaEndGameSentence = {
  id: '00000000-0000-4000-8000-000000000030',
  message: 'Excellent score!',
  score_type: ScoreType.GOOD,
} satisfies PrismaEndGameSentence;

describe('SentenceMapper.toSentenceDto', () => {
  it('maps a persisted end-game sentence', () => {
    const sentence = SentenceMapper.toSentenceDto(prismaEndGameSentence);

    expect(sentence).toEqual({
      id: '00000000-0000-4000-8000-000000000030',
      message: 'Excellent score!',
      score_type: ScoreType.GOOD,
    });
  });
});
