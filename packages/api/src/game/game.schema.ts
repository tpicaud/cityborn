import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import {
  FullGuessObjectSchema,
  GuessObjectIdSchema,
} from '../guess-object/guess-object.schema';
import { type Pack, PackSchema } from '../pack/pack.schema';
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

const GameConfigInputSchema = z.object({
  packs: z.array(PackSchema).optional(),
  /**
   * @deprecated Utiliser `packs` à la place. Conservé pour les builds mobile
   * publiées avant le renommage de Category en Pack.
   * @deprecatedSince 2026-10-23
   */
  categories: z.array(PackSchema).optional(),
  timer: z.number(),
  nbOfObjects: z.number(),
});

export const GameConfigSchema = extendApi(
  GameConfigInputSchema.transform(
    ({ packs, categories, ...settings }, context) => {
      const selectedPacks: Pack[] | undefined = categories ?? packs;
      if (selectedPacks === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: z.ZodParsedType.array,
          received: z.ZodParsedType.undefined,
          path: ['packs'],
        });
        return z.NEVER;
      }
      return { ...settings, packs: selectedPacks, categories: selectedPacks };
    },
  ),
  { required: ['categories'] },
);

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
  packs: [],
  categories: [],
  timer: 25,
  nbOfObjects: 6,
};

export type Coord = z.infer<typeof CoordSchema>;
export type Guess = z.infer<typeof GuessSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type GameConfigChanges = Partial<Omit<GameConfig, 'categories'>>;
export type Round = z.infer<typeof RoundSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type Game = z.infer<typeof GameSchema>;

export function applyGameConfigChanges({
  gameConfig,
  changes,
}: {
  gameConfig: GameConfig;
  changes: GameConfigChanges;
}): GameConfig {
  const packs: Pack[] = changes.packs ?? gameConfig.packs;
  return { ...gameConfig, ...changes, packs, categories: packs };
}
