import { ErrorCode, ScoreType } from '@cityborn/api';
import type { EndGameSentence as PrismaEndGameSentence } from '@prisma/client';
import { createMock } from '../../test/support/createMock';
import type { PrismaService } from '../prisma/prisma.service';
import { SentenceService } from './sentence.service';

const prismaEndGameSentence = {
  id: '00000000-0000-4000-8000-000000000030',
  message: 'Excellent score!',
  score_type: ScoreType.GOOD,
} satisfies PrismaEndGameSentence;

describe('SentenceService.findRandomOne', () => {
  it('returns the randomly selected mapped sentence', async () => {
    const prismaService = createMock<PrismaService>();
    const sentenceService = new SentenceService(prismaService);
    const firstSentence = prismaEndGameSentence;
    const secondSentence = {
      ...prismaEndGameSentence,
      id: 'sentence-2',
      message: 'Perfect!',
    };
    prismaService.endGameSentence.findMany.mockResolvedValue([
      firstSentence,
      secondSentence,
    ]);
    jest.spyOn(Math, 'random').mockReturnValue(0.75);

    const sentence = await sentenceService.findRandomOne(ScoreType.GOOD);

    expect(prismaService.endGameSentence.findMany).toHaveBeenCalledWith({
      where: { score_type: ScoreType.GOOD },
    });
    expect(sentence.id).toBe('sentence-2');
  });

  it('rejects when no sentence matches the score', async () => {
    const prismaService = createMock<PrismaService>();
    const sentenceService = new SentenceService(prismaService);
    prismaService.endGameSentence.findMany.mockResolvedValue([]);

    await expect(
      sentenceService.findRandomOne(ScoreType.BAD),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND },
    });
  });
});
