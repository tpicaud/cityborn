import { SessionSchema } from '@cityborn/api';
import { z } from 'zod';

export const SessionStateSchema = SessionSchema.extend({
  scoringMode: z.enum(['legacy', 'server']).default('legacy'),
});

export type SessionState = z.infer<typeof SessionStateSchema>;
