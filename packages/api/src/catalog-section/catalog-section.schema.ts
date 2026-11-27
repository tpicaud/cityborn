import { z } from 'zod';
import { PackIdSchema } from '../pack/pack.schema';
import { ThemeIdSchema } from '../theme/theme.schema';

export const CatalogSectionIdSchema = z
  .string()
  .uuid()
  .brand<'CatalogSectionId'>();

export type CatalogSectionId = z.infer<typeof CatalogSectionIdSchema>;

export const CatalogSectionSchema = z.object({
  id: CatalogSectionIdSchema,
  name: z.string(),
  isDefault: z.boolean(),
  themeId: ThemeIdSchema.nullable(),
  packIds: z.array(PackIdSchema),
});

export type CatalogSection = z.infer<typeof CatalogSectionSchema>;

export const CatalogSectionsSchema = z.array(CatalogSectionSchema);

export const CatalogSectionNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom est obligatoire')
  .max(40, 'Le nom ne peut pas dépasser 40 caractères');

export const SaveCatalogSectionSchema = z.object({
  name: CatalogSectionNameSchema,
});

export type SaveCatalogSection = z.infer<typeof SaveCatalogSectionSchema>;

export const CreateCatalogSectionSchema = SaveCatalogSectionSchema.extend({
  themeId: ThemeIdSchema.nullable(),
});

export type CreateCatalogSection = z.infer<typeof CreateCatalogSectionSchema>;

export const CatalogSectionIdParamSchema = z.object({
  id: CatalogSectionIdSchema,
});

export const CatalogSectionPackParamSchema = z.object({
  id: CatalogSectionIdSchema,
  packId: z.string().uuid().pipe(PackIdSchema),
});

export enum CatalogSectionMoveDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export const MoveCatalogSectionSchema = z.object({
  direction: z.nativeEnum(CatalogSectionMoveDirection),
});

export type MoveCatalogSection = z.infer<typeof MoveCatalogSectionSchema>;
