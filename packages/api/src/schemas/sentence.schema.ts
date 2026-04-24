import { z } from 'zod';

export const ScoreTypeSchema = z.enum(['GOOD', 'AVERAGE', 'BAD']);

export const SentenceSchema = z.object({
  id: z.string(),
  message: z.string(),
  score_type: ScoreTypeSchema,
});

export type ScoreType = z.infer<typeof ScoreTypeSchema>;
export type Sentence = z.infer<typeof SentenceSchema>;
