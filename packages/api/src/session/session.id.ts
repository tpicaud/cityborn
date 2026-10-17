import { z } from 'zod';

export const SessionIdSchema = z.string().brand<'SessionId'>();
export const SessionIdParamSchema = z.object({ id: SessionIdSchema });

export type SessionId = z.infer<typeof SessionIdSchema>;
