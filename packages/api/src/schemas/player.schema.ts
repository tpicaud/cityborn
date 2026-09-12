import { z } from 'zod';
import {
  GuessObjectIdSchema,
  PlayerIdSchema,
  UserIdSchema,
} from './common.schema';

export const PlayerSchema = z.object({
  username: PlayerIdSchema,
  isGuest: z.boolean(),
  id: UserIdSchema.optional(),
});

export const OnlinePlayerSchema = PlayerSchema.extend({
  connected: z.boolean(),
});

export const SessionPlayerSchema = PlayerSchema.extend({
  connected: z.boolean().optional(),
});

export const GamePlayerSchema = PlayerSchema.extend({
  connected: z.boolean(),
});

export const ResultSchema = z.object({
  guessObjectId: GuessObjectIdSchema,
  distance: z.number(),
  points: z.number(),
});

export const PlayerResultsSchema = z.object({
  results: z.array(ResultSchema),
});

export type Player = z.infer<typeof PlayerSchema>;
export type OnlinePlayer = z.infer<typeof OnlinePlayerSchema>;
export type SessionPlayer = z.infer<typeof SessionPlayerSchema>;
export type GamePlayer = z.infer<typeof GamePlayerSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type PlayerResults = z.infer<typeof PlayerResultsSchema>;
