import { z } from 'zod';
import { WorldLocationSchema } from './world-location.schema.js';

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
  world_location_id: z.string(),
  world_location: WorldLocationSchema.optional(),
});

export const GuessObjectsSchema = z.array(GuessObjectSchema);

export const CreateGuessObjectSchema = GuessObjectSchema.omit({
  id: true,
  world_location: true,
});

export const GuessObjectCandidateSchema = GuessObjectSchema.omit({
  id: true,
  world_location_id: true,
}).extend({
  id: z.string().optional(),
  world_location_id: z.string().optional(),
});

export const GuessObjectCandidatesSchema = z.array(GuessObjectCandidateSchema);

export type GuessObject = z.infer<typeof GuessObjectSchema>;
export type CreateGuessObject = z.infer<typeof CreateGuessObjectSchema>;
export type GuessObjectCandidate = z.infer<typeof GuessObjectCandidateSchema>;
export type GuessObjectCandidates = z.infer<typeof GuessObjectCandidatesSchema>;
