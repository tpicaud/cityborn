import type { ScoreType, Sentence } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { SentenceMapper } from '../mapper/sentence.mapper';
import type { SentenceRepository } from './sentence.repository';

@Injectable()
export class PrismaSentenceRepository implements SentenceRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findByScoreType(score_type: ScoreType): Promise<Sentence[]> {
    const sentences = await this.txHost.tx.endGameSentence.findMany({
      where: { score_type },
    });

    return sentences.map(SentenceMapper.toSentenceDto);
  }
}
