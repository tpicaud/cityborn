import { z } from 'zod';
import { SentenceIdSchema } from './sentence.id';

export enum ScoreType {
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  BAD = 'BAD',
}

export const ScoreTypeSchema = z.nativeEnum(ScoreType);

export const SentenceSchema = z.object({
  id: SentenceIdSchema,
  message: z.string(),
  score_type: ScoreTypeSchema,
});

export type Sentence = z.infer<typeof SentenceSchema>;
