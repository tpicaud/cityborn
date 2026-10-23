import { z } from 'zod';
import {
  GuessObjectIdSchema,
  GuessObjectSchema,
} from '../guess-object/guess-object.schema';

export const PackIdSchema = z.string().brand<'PackId'>();
export const PackUuidIdSchema = z.string().uuid().brand<'PackId'>();
export const PackIdParamSchema = z.object({ id: PackIdSchema });

export type PackId = z.infer<typeof PackIdSchema>;

export const PackSchema = z.object({
  id: PackIdSchema,
  name: z.string(),
  isPublished: z.boolean(),
  description: z.string().optional(),
  parentId: PackUuidIdSchema.nullable().optional(),
});

export const FullPackSchema = PackSchema.extend({
  guessObjects: z.array(GuessObjectSchema),
});

export const PacksSchema = z.array(PackSchema);

export const CreatePackSchema = PackSchema.omit({ id: true }).extend({
  guessObjectsIds: z.array(GuessObjectIdSchema).optional(),
});

export const UpdatePackSchema = PackSchema.extend({
  connectIds: z.array(GuessObjectIdSchema).optional(),
  disconnectIds: z.array(GuessObjectIdSchema).optional(),
});

export type PackTree = {
  id: PackId;
  name: string;
  isPublished: boolean;
  description?: string;
  parentId?: PackId | null;
  children: PackTree[];
};

export type PackTreeInput = {
  id: string;
  name: string;
  isPublished: boolean;
  description?: string;
  parentId?: string | null;
  children: PackTreeInput[];
};

export const PackTreeSchema: z.ZodType<PackTree, z.ZodTypeDef, PackTreeInput> =
  z.lazy(() =>
    z.object({
      id: PackIdSchema,
      name: z.string(),
      isPublished: z.boolean(),
      description: z.string().optional(),
      parentId: PackUuidIdSchema.nullable().optional(),
      children: z.array(PackTreeSchema),
    }),
  );
export const PackTreesSchema = z.array(PackTreeSchema);

export type Pack = z.infer<typeof PackSchema>;
export type FullPack = z.infer<typeof FullPackSchema>;
export type CreatePack = z.infer<typeof CreatePackSchema>;
export type CreatePackInput = z.input<typeof CreatePackSchema>;
export type UpdatePack = z.infer<typeof UpdatePackSchema>;

/**
 * @deprecated Utiliser `PackIdParamSchema` à la place. Conservé pour les
 * routes `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export const CategoryIdParamSchema = PackIdParamSchema;

/**
 * @deprecated Utiliser `PackSchema` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export const CategorySchema = PackSchema;

/**
 * @deprecated Utiliser `PacksSchema` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export const CategoriesSchema = PacksSchema;

/**
 * @deprecated Utiliser `PackTreesSchema` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export const CategoryTreesSchema = PackTreesSchema;

/**
 * @deprecated Utiliser `PackId` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export type CategoryId = PackId;

/**
 * @deprecated Utiliser `Pack` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export type Category = Pack;

/**
 * @deprecated Utiliser `PackTree` à la place. Conservé pour les routes
 * `/category` dépréciées.
 * @deprecatedSince 2026-10-23
 */
export type CategoryTree = PackTree;
