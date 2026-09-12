import { z } from 'zod';
import { SentenceIdSchema } from './common.schema';
import { ScoreTypeSchema } from './enums';

export const SentenceSchema = z.object({
  id: SentenceIdSchema,
  message: z.string(),
  score_type: ScoreTypeSchema,
});

export type Sentence = z.infer<typeof SentenceSchema>;
