import { z } from 'zod';
import { GuessObjectSchema } from './guess-object.schema';

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isPublished: z.boolean(),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const FullCategorySchema = CategorySchema.extend({
  guessObjects: z.array(GuessObjectSchema),
});

export const CategoriesSchema = z.array(CategorySchema);

export const CreateCategorySchema = CategorySchema.omit({ id: true }).extend({
  guessObjectsIds: z.array(z.string()).optional(),
});

export const UpdateCategorySchema = CategorySchema.extend({
  connectIds: z.array(z.string()).optional(),
  disconnectIds: z.array(z.string()).optional(),
});

export type CategoryTree = {
  id: string;
  name: string;
  isPublished: boolean;
  description?: string;
  parentId?: string | null;
  children: CategoryTree[];
};

export const CategoryTreeSchema: z.ZodType<CategoryTree> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    isPublished: z.boolean(),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    children: z.array(CategoryTreeSchema),
  }),
);
export const CategoryTreesSchema = z.array(CategoryTreeSchema);

export type Category = z.infer<typeof CategorySchema>;
export type FullCategory = z.infer<typeof FullCategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
