import { z } from 'zod';
import {
  GameStatus,
  RoundStatus,
  SessionMode,
  SessionStatus,
} from './enums.js';

// Enums
export const SessionModeSchema = z.nativeEnum(SessionMode);
export const SessionStatusSchema = z.nativeEnum(SessionStatus);
export const GameStatusSchema = z.nativeEnum(GameStatus);
export const RoundStatusSchema = z.nativeEnum(RoundStatus);

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
export type Coord = z.infer<typeof CoordSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type OnlinePlayer = z.infer<typeof OnlinePlayerSchema>;
export type SessionPlayer = z.infer<typeof SessionPlayerSchema>;
export type GamePlayer = z.infer<typeof GamePlayerSchema>;
export type Guess = z.infer<typeof GuessSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type PlayerResults = z.infer<typeof PlayerResultsSchema>;
