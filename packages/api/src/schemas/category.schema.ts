import { z } from 'zod';
import { GuessObjectSchema } from './guess-object.schema.js';

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isPublished: z.boolean(),
  description: z.string().optional(),
  guessObjectsIds: z.array(z.string()).optional(),
  guessObjects: z.array(GuessObjectSchema).optional(),
});

export const CategoriesSchema = z.array(CategorySchema);

export const CreateCategorySchema = CategorySchema.omit({ id: true });

export const UpdateCategorySchema = CategorySchema.extend({
  connectIds: z.array(z.string()).optional(),
  disconnectIds: z.array(z.string()).optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
