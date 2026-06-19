import { z } from 'zod';

export const PlayerSchema = z.object({
  username: z.string(),
  isGuest: z.boolean(),
  id: z.string().optional(),
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
  guessObjectId: z.string(),
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
