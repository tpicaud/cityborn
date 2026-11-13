import { z } from 'zod';
import { PackIdSchema } from '../pack/pack.schema';
import { ThemeIdSchema } from '../theme/theme.schema';

export const CatalogSectionIdSchema = z
  .string()
  .uuid()
  .brand<'CatalogSectionId'>();
export type CatalogSectionId = z.infer<typeof CatalogSectionIdSchema>;
export const CatalogSectionNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom est obligatoire')
  .max(40, 'Le nom ne peut pas dépasser 40 caractères')
  .refine(
    (name) => name.toLowerCase() !== 'tous les packs',
    'Le nom « Tous les packs » est réservé',
  );
export const CatalogSectionSchema = z.object({
  id: CatalogSectionIdSchema,
  name: z.string(),
  themeId: ThemeIdSchema.nullable(),
  packIds: z.array(PackIdSchema),
});
export const CatalogSectionsSchema = z.array(CatalogSectionSchema);
export type CatalogSection = z.infer<typeof CatalogSectionSchema>;
export const CreateCatalogSectionSchema = z.object({
  name: CatalogSectionNameSchema,
  themeId: ThemeIdSchema.nullable(),
});
export type CreateCatalogSection = z.infer<typeof CreateCatalogSectionSchema>;
export const RenameCatalogSectionSchema = z.object({
  name: CatalogSectionNameSchema,
});
export type RenameCatalogSection = z.infer<typeof RenameCatalogSectionSchema>;
export enum CatalogSectionMoveDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}
export const MoveCatalogSectionSchema = z.object({
  direction: z.nativeEnum(CatalogSectionMoveDirection),
});
export type MoveCatalogSection = z.infer<typeof MoveCatalogSectionSchema>;
export const CatalogSectionIdParamSchema = z.object({
  id: CatalogSectionIdSchema,
});
export const CatalogSectionPackParamSchema = CatalogSectionIdParamSchema.extend(
  { packId: z.string().uuid().pipe(PackIdSchema) },
);
