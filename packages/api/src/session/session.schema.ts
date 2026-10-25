import { z } from 'zod';
import { GameConfigSchema, GameSchema } from '../game/game.schema';
import {
  type PlayerId,
  PlayerIdSchema,
  SessionPlayerSchema,
} from '../player/player.schema';

export const SessionIdSchema = z.string().brand<'SessionId'>();
export const SessionIdParamSchema = z.object({ id: SessionIdSchema });

export type SessionId = z.infer<typeof SessionIdSchema>;

export enum SessionMode {
  SOLO = 'solo',
  MULTI = 'multi',
}

export enum SessionStatus {
  IN_LOBBY = 'IN_LOBBY',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
}

export const SessionModeSchema = z.nativeEnum(SessionMode);
export const SessionStatusSchema = z.nativeEnum(SessionStatus);

export const CreateSessionSchema = z.object({ mode: SessionModeSchema });
export const SessionReconnectTokenSchema = z
  .string()
  .min(1)
  .brand<'SessionReconnectToken'>();
export const SessionHostIdSchema = z
  .string()
  .refine(
    (hostId): hostId is '' | PlayerId =>
      hostId === '' || PlayerIdSchema.safeParse(hostId).success,
  );

export const SessionSchema = z.object({
  id: SessionIdSchema,
  serverTime: z.number().optional(),
  hostID: SessionHostIdSchema,
  mode: SessionModeSchema,
  status: SessionStatusSchema,
  gameConfig: GameConfigSchema,
  players: z.array(SessionPlayerSchema),
  currentGame: GameSchema.optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionReconnectToken = z.infer<typeof SessionReconnectTokenSchema>;
