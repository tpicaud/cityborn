import { ScoreType, Sentence } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SentenceMapper } from './mapper/sentence.mapper';

@Injectable()
export class SentenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findRandomOne(score_type: ScoreType): Promise<Sentence> {
    const sentences = await this.prisma.endGameSentence.findMany({
      where: {
        score_type,
      },
    });

    if (sentences.length === 0) {
      throw new NotFoundException({
        code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND,
        message: 'Sentence not found',
      });
    }

    const randomIndex = Math.floor(Math.random() * sentences.length);
    const randomSentence = sentences[randomIndex];

    return SentenceMapper.toSentenceDto(randomSentence);
  }
}
