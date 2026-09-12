import { z } from 'zod';
import { PlayerIdSchema, SessionIdSchema } from './common.schema';
import { SessionModeSchema, SessionStatusSchema } from './enums';
import { GameConfigSchema, GameSchema } from './game.schema';
import { SessionPlayerSchema } from './player.schema';

export const CreateSessionSchema = z.object({ mode: SessionModeSchema });

export const SessionSchema = z.object({
  id: SessionIdSchema,
  hostID: PlayerIdSchema,
  mode: SessionModeSchema,
  status: SessionStatusSchema,
  gameConfig: GameConfigSchema,
  players: z.array(SessionPlayerSchema),
  currentGame: GameSchema.optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
