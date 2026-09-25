import { z } from 'zod';

export const UserIdSchema = z.string().brand<'UserId'>();
export const CategoryIdSchema = z.string().brand<'CategoryId'>();
export const GuessObjectIdSchema = z.string().brand<'GuessObjectId'>();
export const WorldLocationIdSchema = z.string().brand<'WorldLocationId'>();
export const GuessObjectUuidIdSchema = z
  .string()
  .uuid()
  .brand<'GuessObjectId'>();
export const WorldLocationUuidIdSchema = z
  .string()
  .uuid()
  .brand<'WorldLocationId'>();
export const GameRecordIdSchema = z.string().brand<'GameRecordId'>();
export const SentenceIdSchema = z.string().brand<'SentenceId'>();
export const SessionIdSchema = z.string().brand<'SessionId'>();
export const GameIdSchema = z.string().brand<'GameId'>();
export const PlayerIdSchema = z.string().brand<'PlayerId'>();
export const UsernameSchema = PlayerIdSchema.brand<'Username'>();
export const VisitorIdSchema = z.string().min(1).brand<'VisitorId'>();

export const CategoryIdParamSchema = z.object({ id: CategoryIdSchema });
export const GuessObjectIdParamSchema = z.object({ id: GuessObjectIdSchema });
export const SessionIdParamSchema = z.object({ id: SessionIdSchema });

export const IdSchema = z.string().uuid();
export const emptyRequestBodySchema = z.object({});
export const emptyResponseSchema = z.object({});
export const requestErrorSchema = z.object({
  status: z.number(),
});

export const IdParamSchema = z.object({ id: z.string() });
export const IncludeQuerySchema = z.object({ include: z.string().optional() });

export type UserId = z.infer<typeof UserIdSchema>;
export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type GuessObjectId = z.infer<typeof GuessObjectIdSchema>;
export type WorldLocationId = z.infer<typeof WorldLocationIdSchema>;
export type GameRecordId = z.infer<typeof GameRecordIdSchema>;
export type SentenceId = z.infer<typeof SentenceIdSchema>;
export type SessionId = z.infer<typeof SessionIdSchema>;
export type GameId = z.infer<typeof GameIdSchema>;
export type Username = z.infer<typeof UsernameSchema>;
export type PlayerId = z.infer<typeof PlayerIdSchema>;
export type VisitorId = z.infer<typeof VisitorIdSchema>;
