import { z } from 'zod';
import { WorldLocationSchema } from './world-location.schema';

export const GuessObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  source: z
    .object({
      provider: z.string(),
      external_id: z.string(),
    })
    .optional(),
});
export const GuessObjectsSchema = z.array(GuessObjectSchema);

export const FullGuessObjectSchema = GuessObjectSchema.extend({
  world_location: WorldLocationSchema,
});
export const FullGuessObjectsSchema = z.array(FullGuessObjectSchema);

export const CreateGuessObjectSchema = GuessObjectSchema.omit({
  id: true,
}).extend({
  world_location_id: z.string(),
  world_location: WorldLocationSchema,
});

export const GuessObjectDraftSchema = GuessObjectSchema.omit({
  id: true,
}).extend({
  world_location_id: z.string().optional(),
  world_location: WorldLocationSchema.optional(),
});

export const GuessObjectDraftsSchema = z.array(GuessObjectDraftSchema);

export type GuessObject = z.infer<typeof GuessObjectSchema>;
export type FullGuessObject = z.infer<typeof FullGuessObjectSchema>;
export type GuessObjectDraft = z.infer<typeof GuessObjectDraftSchema>;
export type CreateGuessObject = z.infer<typeof CreateGuessObjectSchema>;
