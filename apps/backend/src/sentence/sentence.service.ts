import { ErrorCode } from '@cityborn/errors';
import type { ScoreType } from '@cityborn/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/prisma/prisma.service';
import type { SentenceDto } from './dto/sentence.dto';
import { SentenceMapper } from './mapper/sentence.mapper';

@Injectable()
export class SentenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findRandomOne(score_type: ScoreType): Promise<SentenceDto> {
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
