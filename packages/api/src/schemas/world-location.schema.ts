import { z } from 'zod';

const WorldLocationSourceSchema = z.object({
  provider: z.string(),
  external_id: z.coerce.string(),
});
export const WorldLocationSchema = z.object({
  id: z.string(),
  osm_type: z.string(),
  name: z.string(),
  display_name: z.string(),
  addresstype: z.string().optional(),
  centroid: z.tuple([z.number(), z.number()]),
  source: WorldLocationSourceSchema,
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
});

export type WorldLocationSource = z.infer<typeof WorldLocationSourceSchema>;
export type WorldLocation = z.infer<typeof WorldLocationSchema>;
export type WorldLocationPreview = z.infer<typeof WorldLocationPreviewSchema>;
export type WorldLocations = z.infer<typeof WorldLocationsSchema>;
export type CreateWorldLocation = z.infer<typeof CreateWorldLocationSchema>;
