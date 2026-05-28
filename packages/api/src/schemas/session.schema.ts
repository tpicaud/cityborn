import { z } from 'zod';
import { SessionModeSchema, SessionStatusSchema } from './enums.js';
import { GameConfigSchema, GameSchema, GameStateSchema } from './game.schema.js';
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

export const EndSoloGameSchema = SessionSchema.extend({
  currentGame: GameSchema.extend({
    state: GameStateSchema.omit({ guessObjects: true }),
  }),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type EndSoloGame = z.infer<typeof EndSoloGameSchema>;
