import { z } from 'zod';
import { SessionModeSchema, SessionStatusSchema } from './enums.js';
import { GameConfigSchema, GameSchema } from './game.schema.js';
import { PlayerSchema } from './player.schema.js';

export const CreateSessionSchema = z.object({ mode: SessionModeSchema });

export const SessionSchema = z.object({
  id: z.string(),
  hostID: z.string(),
  mode: SessionModeSchema,
  status: SessionStatusSchema,
  gameConfig: GameConfigSchema,
  players: z.array(PlayerSchema),
  currentGame: GameSchema.optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
