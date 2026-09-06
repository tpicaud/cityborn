import { ScoreType } from '@cityborn/api';
import { buildPrismaEndGameSentence } from '../../../test/support/fixtures';
import { SentenceMapper } from './sentence.mapper';

describe('SentenceMapper.toSentenceDto', () => {
  it('maps a persisted end-game sentence', () => {
    const sentence = SentenceMapper.toSentenceDto(buildPrismaEndGameSentence());

    expect(sentence).toEqual({
      id: '00000000-0000-4000-8000-000000000030',
      message: 'Excellent score!',
      score_type: ScoreType.GOOD,
    });
  });
});
