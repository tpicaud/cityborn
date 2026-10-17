import { z } from 'zod';
import { CategorySchema } from '../category/category.schema';
import {
  FullGuessObjectSchema,
  GuessObjectIdSchema,
} from '../guess-object/guess-object.schema';
import { PlayerIdSchema, PlayerResultsSchema } from '../player/player.schema';

export const GameIdSchema = z.string().brand<'GameId'>();

export type GameId = z.infer<typeof GameIdSchema>;

export enum GameStatus {
  STARTING = 'STARTING',
  IN_GAME = 'IN_GAME',
  IN_RESULTS = 'IN_RESULTS',
  FINISHED = 'FINISHED',
}

export enum RoundStatus {
  GUESSING = 'GUESSING',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
}

export const GameStatusSchema = z.nativeEnum(GameStatus);
export const RoundStatusSchema = z.nativeEnum(RoundStatus);

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
