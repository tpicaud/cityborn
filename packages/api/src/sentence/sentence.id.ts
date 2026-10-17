import { z } from 'zod';

export const SentenceIdSchema = z.string().brand<'SentenceId'>();

export type SentenceId = z.infer<typeof SentenceIdSchema>;
