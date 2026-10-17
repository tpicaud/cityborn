import { z } from 'zod';

export const GuessObjectIdSchema = z.string().brand<'GuessObjectId'>();
export const GuessObjectUuidIdSchema = z
  .string()
  .uuid()
  .brand<'GuessObjectId'>();
export const GuessObjectIdParamSchema = z.object({ id: GuessObjectIdSchema });

export type GuessObjectId = z.infer<typeof GuessObjectIdSchema>;
