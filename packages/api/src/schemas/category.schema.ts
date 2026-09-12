import { z } from 'zod';
import {
  type CategoryId,
  CategoryIdSchema,
  GuessObjectIdSchema,
} from './common.schema';
import { GuessObjectSchema } from './guess-object.schema';

export const CategorySchema = z.object({
  id: CategoryIdSchema,
  name: z.string(),
  isPublished: z.boolean(),
  description: z.string().optional(),
  parentId: z.string().uuid().brand<'CategoryId'>().nullable().optional(),
});

export const FullCategorySchema = CategorySchema.extend({
  guessObjects: z.array(GuessObjectSchema),
});

export const CategoriesSchema = z.array(CategorySchema);

export const CreateCategorySchema = CategorySchema.omit({ id: true }).extend({
  guessObjectsIds: z.array(GuessObjectIdSchema).optional(),
});

export const UpdateCategorySchema = CategorySchema.extend({
  connectIds: z.array(GuessObjectIdSchema).optional(),
  disconnectIds: z.array(GuessObjectIdSchema).optional(),
});

export type CategoryTree = {
  id: CategoryId;
  name: string;
  isPublished: boolean;
  description?: string;
  parentId?: CategoryId | null;
  children: CategoryTree[];
};

export type CategoryTreeInput = {
  id: string;
  name: string;
  isPublished: boolean;
  description?: string;
  parentId?: string | null;
  children: CategoryTreeInput[];
};

export const CategoryTreeSchema: z.ZodType<
  CategoryTree,
  z.ZodTypeDef,
  CategoryTreeInput
> = z.lazy(() =>
  z.object({
    id: CategoryIdSchema,
    name: z.string(),
    isPublished: z.boolean(),
    description: z.string().optional(),
    parentId: z.string().uuid().brand<'CategoryId'>().nullable().optional(),
    children: z.array(CategoryTreeSchema),
  }),
);
export const CategoryTreesSchema = z.array(CategoryTreeSchema);

export type Category = z.infer<typeof CategorySchema>;
export type FullCategory = z.infer<typeof FullCategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type CreateCategoryInput = z.input<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
