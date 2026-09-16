import type { ScoreType, Sentence } from '@cityborn/api';

export const SENTENCE_REPOSITORY = Symbol('SENTENCE_REPOSITORY');

export interface SentenceRepository {
  findByScoreType(score_type: ScoreType): Promise<Sentence[]>;
}
