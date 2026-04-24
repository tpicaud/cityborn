import { z } from 'zod';
import {
  PlayerSchema,
  SessionModeSchema,
  SessionStatusSchema,
} from './common.schema.js';
import { GameConfigSchema, GameSchema } from './game.schema.js';

export const SessionSchema = z.object({
  id: z.string(),
  hostID: z.string(),
  mode: SessionModeSchema,
  status: SessionStatusSchema,
  gameConfig: GameConfigSchema,
  players: z.array(PlayerSchema),
  currentGame: GameSchema.optional(),
});

export type Session = z.infer<typeof SessionSchema>;
