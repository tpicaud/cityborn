import { z } from 'zod';

export const CatalogSectionIdSchema = z
  .string()
  .uuid()
  .brand<'CatalogSectionId'>();

export type CatalogSectionId = z.infer<typeof CatalogSectionIdSchema>;

export const CatalogSectionSchema = z.object({
  id: CatalogSectionIdSchema,
  name: z.string(),
  isDefault: z.boolean(),
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

export const CatalogSectionIdParamSchema = z.object({
  id: CatalogSectionIdSchema,
});

export enum CatalogSectionMoveDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export const MoveCatalogSectionSchema = z.object({
  direction: z.nativeEnum(CatalogSectionMoveDirection),
});

export type MoveCatalogSection = z.infer<typeof MoveCatalogSectionSchema>;
