import { z } from 'zod';

export const WorldLocationSchema = z.object({
  id: z.string(),
  osm_type: z.string(),
  name: z.string(),
  type: z.enum(['area', 'point']),
  display_name: z.string().optional(),
  addresstype: z.string().optional(),
  level: z.enum(['ADM1', 'ADM2', 'ADM3', 'ADM4']).optional(),
  iso_code: z.string().optional(),
  centroid: z.tuple([z.number(), z.number()]).optional(),
  source: z
    .object({
      provider: z.string(),
      external_id: z.coerce.string(),
    })
    .optional(),
  geometry: z.object({
    type: z.enum(['Point', 'Polygon', 'MultiPolygon']),
    coordinates: z.array(z.unknown()),
  }),
});

export const WorldLocationPreviewSchema = WorldLocationSchema.pick({
  id: true,
  name: true,
  display_name: true,
});

export const WorldLocationsSchema = z.array(WorldLocationSchema);

export const CreateWorldLocationSchema = WorldLocationSchema.omit({
  id: true,
}).extend({
  // required here: find-or-create dedups on (osm_type, source.external_id)
  source: z.object({
    provider: z.string(),
    external_id: z.coerce.string(),
  }),
});

export type WorldLocation = z.infer<typeof WorldLocationSchema>;
export type WorldLocationPreview = z.infer<typeof WorldLocationPreviewSchema>;
export type WorldLocations = z.infer<typeof WorldLocationsSchema>;
export type CreateWorldLocation = z.infer<typeof CreateWorldLocationSchema>;
