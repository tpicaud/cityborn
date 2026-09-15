import { ErrorCode, ScoreType, SentenceSchema } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { SentenceRepository } from './repositories/sentence.repository';
import { SentenceService } from './sentence.service';

const firstSentence = SentenceSchema.parse({
  id: '00000000-0000-4000-8000-000000000030',
  message: 'Excellent score!',
  score_type: ScoreType.GOOD,
});

function buildSentenceService() {
  const sentenceRepository = createMock<SentenceRepository>();
  const sentenceService = new SentenceService(sentenceRepository);
  return { sentenceRepository, sentenceService };
}

describe('SentenceService.findRandomOne', () => {
  it('returns the randomly selected sentence', async () => {
    const { sentenceRepository, sentenceService } = buildSentenceService();
    const secondSentence = SentenceSchema.parse({
      ...firstSentence,
      id: 'sentence-2',
      message: 'Perfect!',
    });
    sentenceRepository.findByScoreType.mockResolvedValue([
      firstSentence,
      secondSentence,
    ]);
    jest.spyOn(Math, 'random').mockReturnValue(0.75);

    const sentence = await sentenceService.findRandomOne(ScoreType.GOOD);

    expect(sentenceRepository.findByScoreType).toHaveBeenCalledWith(
      ScoreType.GOOD,
    );
    expect(sentence.id).toBe(secondSentence.id);
  });

  it('rejects when no sentence matches the score', async () => {
    const { sentenceRepository, sentenceService } = buildSentenceService();
    sentenceRepository.findByScoreType.mockResolvedValue([]);

    await expect(
      sentenceService.findRandomOne(ScoreType.BAD),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND },
    });
  });
});
