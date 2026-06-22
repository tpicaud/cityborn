import { z } from 'zod';
import { GuessObjectSchema } from './guess-object.schema';

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isPublished: z.boolean(),
  description: z.string().optional(),
});

export const FullCategorySchema = CategorySchema.extend({
  guessObjects: z.array(GuessObjectSchema),
});

export const CategoriesSchema = z.array(CategorySchema);

export const CreateCategorySchema = CategorySchema.omit({ id: true }).extend({
  guessObjectsIds: z.array(z.string()).optional(),
});

export const UpdateCategorySchema = CategorySchema.extend({
  guessObjectsIds: z.array(z.string()).optional(),
  connectIds: z.array(z.string()).optional(),
  disconnectIds: z.array(z.string()).optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type FullCategory = z.infer<typeof FullCategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
