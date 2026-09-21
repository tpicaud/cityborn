import { z } from 'zod';
import { CategorySchema } from './category.schema';
import {
  GameIdSchema,
  GameRecordIdSchema,
  GuessObjectIdSchema,
  PlayerIdSchema,
} from './common.schema';
import {
  GameStatusSchema,
  RoundStatusSchema,
  SessionModeSchema,
} from './enums.schema';
import { FullGuessObjectSchema } from './guess-object.schema';
import { PlayerResultsSchema, PlayerSchema } from './player.schema';

function isCompleteRecord<Key extends string, Value>(
  record: Partial<Record<Key, Value>>,
): record is Record<Key, Value> {
  return Object.values(record).every((value) => value !== undefined);
}

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

const PlayerGuessesSchema = z
  .record(PlayerIdSchema, GuessSchema)
  .refine(isCompleteRecord);
const PlayerResultsByIdSchema = z
  .record(PlayerIdSchema, PlayerResultsSchema)
  .refine(isCompleteRecord);

export const GameConfigSchema = z.object({
  categories: z.array(CategorySchema),
  timer: z.number(),
  nbOfObjects: z.number(),
});

export const RoundSchema = z.object({
  status: RoundStatusSchema,
  guessObjectId: GuessObjectIdSchema,
  playersGuesses: PlayerGuessesSchema.optional(),
});

export const GameStateSchema = z.object({
  guessObjectsIds: z.array(GuessObjectIdSchema),
  results: PlayerResultsByIdSchema,
  currentRound: RoundSchema.optional(),
  guessObjects: z.array(FullGuessObjectSchema).optional(),
});

export const GameSchema = z.object({
  id: GameIdSchema,
  config: GameConfigSchema,
  status: GameStatusSchema,
  state: GameStateSchema,
});

export const GameRecordSchema = z.object({
  id: GameRecordIdSchema,
  mode: SessionModeSchema,
  gameConfig: GameConfigSchema,
  players: z.array(PlayerSchema),
  guessObjectsIds: z.array(GuessObjectIdSchema),
  results: PlayerResultsByIdSchema,
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

export const defaultGameConfig: Readonly<GameConfig> = {
  categories: [],
  timer: 25,
  nbOfObjects: 6,
};

export type Coord = z.infer<typeof CoordSchema>;
export type Guess = z.infer<typeof GuessSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameRecord = z.infer<typeof GameRecordSchema>;
export type CreateGameRecord = z.infer<typeof CreateGameRecordSchema>;
