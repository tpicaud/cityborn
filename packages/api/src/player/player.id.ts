import { z } from 'zod';

export const PlayerIdSchema = z.string().brand<'PlayerId'>();

export type PlayerId = z.infer<typeof PlayerIdSchema>;
