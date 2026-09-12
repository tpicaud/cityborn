import { z } from 'zod';
import { GuessObjectIdSchema, WorldLocationIdSchema } from './common.schema';
import {
  WorldLocationPreviewSchema,
  WorldLocationSchema,
} from './world-location.schema';

export const BaseGuessObjectSchema = z.object({
  id: GuessObjectIdSchema,
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
export const GuessObjectSchema = BaseGuessObjectSchema.extend({
  world_location_preview: WorldLocationPreviewSchema,
});
export const GuessObjectsSchema = z.array(GuessObjectSchema);

export const FullGuessObjectSchema = BaseGuessObjectSchema.extend({
  world_location: WorldLocationSchema,
});
export const FullGuessObjectsSchema = z.array(FullGuessObjectSchema);

export const CreateGuessObjectSchema = BaseGuessObjectSchema.omit({
  id: true,
}).extend({
  world_location_id: WorldLocationIdSchema,
});

export const GuessObjectDraftSchema = BaseGuessObjectSchema.omit({
  id: true,
}).extend({
  id: GuessObjectIdSchema.optional(),
  world_location: WorldLocationSchema.optional(),
});

export const GuessObjectDraftsSchema = z.array(GuessObjectDraftSchema);

export const PatchGuessObjectSchema = BaseGuessObjectSchema.omit({
  id: true,
})
  .partial()
  .extend({
    world_location_id: WorldLocationIdSchema.optional(),
  });

export type GuessObject = z.infer<typeof GuessObjectSchema>;
export type FullGuessObject = z.infer<typeof FullGuessObjectSchema>;
export type GuessObjectDraft = z.infer<typeof GuessObjectDraftSchema>;
export type CreateGuessObject = z.infer<typeof CreateGuessObjectSchema>;
export type PatchGuessObject = z.infer<typeof PatchGuessObjectSchema>;
