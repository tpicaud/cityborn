import { z } from 'zod';
import { ScoreTypeSchema } from './enums';

export const SentenceSchema = z.object({
  id: z.string(),
  message: z.string(),
  score_type: ScoreTypeSchema,
});

export type Sentence = z.infer<typeof SentenceSchema>;
