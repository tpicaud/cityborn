import { z } from 'zod';
import { CategorySchema } from './category.schema';
import {
  GameStatusSchema,
  RoundStatusSchema,
  SessionModeSchema,
} from './enums';
import { GuessObjectSchema } from './guess-object.schema';
import { PlayerResultsSchema, PlayerSchema } from './player.schema';

export const CoordSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const GuessSchema = z.object({
  coordinates: CoordSchema,
  distance: z.number(),
  points: z.number(),
  win: z.boolean(),
});

export const GameConfigSchema = z.object({
  categories: z.array(CategorySchema),
  timer: z.number(),
  nbOfObjects: z.number(),
});

export const RoundSchema = z.object({
  status: RoundStatusSchema,
  guessObjectId: z.string(),
  playersGuesses: z.record(z.string(), GuessSchema).optional(),
});

export const GameStateSchema = z.object({
  guessObjectsIds: z.array(z.string()),
  results: z.record(z.string(), PlayerResultsSchema),
  currentRound: RoundSchema.optional(),
  guessObjects: z.array(GuessObjectSchema).optional(),
});

export const GameSchema = z.object({
  id: z.string(),
  config: GameConfigSchema,
  status: GameStatusSchema,
  state: GameStateSchema,
});

export const GameRecordSchema = z.object({
  id: z.string(),
  mode: SessionModeSchema,
  gameConfig: GameConfigSchema,
  players: z.array(PlayerSchema),
  guessObjectsIds: z.array(z.string()),
  results: z.record(z.string(), PlayerResultsSchema),
  createdAt: z.string(),
});

export const GameRecordsSchema = z.array(GameRecordSchema);

export const CreateGameRecordSchema = GameRecordSchema.omit({
  id: true,
  createdAt: true,
});

export const defaultGuess: Readonly<Guess> = {
  coordinates: { lat: 0, lng: 0 },
  distance: -1,
  points: 0,
  win: false,
};

export type Coord = z.infer<typeof CoordSchema>;
export type Guess = z.infer<typeof GuessSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameRecord = z.infer<typeof GameRecordSchema>;
export type CreateGameRecord = z.infer<typeof CreateGameRecordSchema>;
