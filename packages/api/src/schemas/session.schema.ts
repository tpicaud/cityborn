import { z } from 'zod';
import {
  type PlayerId,
  PlayerIdSchema,
  SessionIdSchema,
} from './common.schema';
import { SessionModeSchema, SessionStatusSchema } from './enums';
import { GameConfigSchema, GameSchema } from './game.schema';
import { SessionPlayerSchema } from './player.schema';

export const CreateSessionSchema = z.object({ mode: SessionModeSchema });
export const SessionHostIdSchema = z
  .string()
  .refine(
    (hostId): hostId is '' | PlayerId =>
      hostId === '' || PlayerIdSchema.safeParse(hostId).success,
  );

export const SessionSchema = z.object({
  id: SessionIdSchema,
  hostID: SessionHostIdSchema,
  mode: SessionModeSchema,
  status: SessionStatusSchema,
  gameConfig: GameConfigSchema,
  players: z.array(SessionPlayerSchema),
  currentGame: GameSchema.optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
