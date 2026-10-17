import { z } from 'zod';

export const SentenceIdSchema = z.string().brand<'SentenceId'>();

export type SentenceId = z.infer<typeof SentenceIdSchema>;

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
