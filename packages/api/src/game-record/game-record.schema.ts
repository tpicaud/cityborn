import { z } from 'zod';
import { GameConfigSchema, GameStateSchema } from '../game/game.schema';
import { GuessObjectIdSchema } from '../guess-object/guess-object.schema';
import { PlayerSchema } from '../player/player.schema';
import { IsoDateTimeSchema } from '../protocol/payload.schema';
import { SessionModeSchema } from '../session/session.schema';

export const GameRecordIdSchema = z.string().brand<'GameRecordId'>();

export type GameRecordId = z.infer<typeof GameRecordIdSchema>;

export const GameRecordSchema = z.object({
  id: GameRecordIdSchema,
  mode: SessionModeSchema,
  gameConfig: GameConfigSchema,
  players: z.array(PlayerSchema),
  guessObjectsIds: z.array(GuessObjectIdSchema),
  results: GameStateSchema.shape.results,
  createdAt: IsoDateTimeSchema,
});

export const GameRecordsSchema = z.array(GameRecordSchema);

export const CreateGameRecordSchema = GameRecordSchema.omit({
  id: true,
  createdAt: true,
});

export type GameRecord = z.infer<typeof GameRecordSchema>;
export type CreateGameRecord = z.infer<typeof CreateGameRecordSchema>;
