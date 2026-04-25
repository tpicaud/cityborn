import { z } from 'zod';
import { ScoreType } from './enums.js';

export const ScoreTypeSchema = z.nativeEnum(ScoreType);

export const SentenceSchema = z.object({
  id: z.string(),
  message: z.string(),
  score_type: ScoreTypeSchema,
});

export type Sentence = z.infer<typeof SentenceSchema>;
