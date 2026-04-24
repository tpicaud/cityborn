import { z } from 'zod';

// Enums
export const SessionModeSchema = z.enum(['solo', 'multi']);
export const SessionStatusSchema = z.enum(['IN_LOBBY', 'IN_GAME', 'FINISHED']);
export const GameStatusSchema = z.enum(['STARTING', 'IN_GAME', 'IN_RESULTS', 'FINISHED']);
export const RoundStatusSchema = z.enum(['GUESSING', 'SHOWING_RESULTS']);

// Primitives
export const CoordSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

// Players
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

// Guess
export const GuessSchema = z.object({
  coordinates: CoordSchema,
  distance: z.number(),
  points: z.number(),
  win: z.boolean(),
});

// Results
export const ResultSchema = z.object({
  guessObjectId: z.string(),
  distance: z.number(),
  points: z.number(),
});

export const PlayerResultsSchema = z.object({
  results: z.array(ResultSchema),
});

// Inferred types
export type SessionMode = z.infer<typeof SessionModeSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type GameStatus = z.infer<typeof GameStatusSchema>;
export type RoundStatus = z.infer<typeof RoundStatusSchema>;
export type Coord = z.infer<typeof CoordSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type OnlinePlayer = z.infer<typeof OnlinePlayerSchema>;
export type SessionPlayer = z.infer<typeof SessionPlayerSchema>;
export type GamePlayer = z.infer<typeof GamePlayerSchema>;
export type Guess = z.infer<typeof GuessSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type PlayerResults = z.infer<typeof PlayerResultsSchema>;
