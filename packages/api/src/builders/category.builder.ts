import type { z } from 'zod';
import {
  type Category,
  CategorySchema,
  type CreateCategory,
  CreateCategorySchema,
  type UpdateCategory,
  UpdateCategorySchema,
} from '../schemas/category.schema';

export function buildCategory(
  overrides: Partial<z.input<typeof CategorySchema>> = {},
): Category {
  return CategorySchema.parse({
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Monuments',
    isPublished: true,
    ...overrides,
  });
}

export function buildCreateCategory(
  overrides: Partial<z.input<typeof CreateCategorySchema>> = {},
): CreateCategory {
  const category = buildCategory();

  return CreateCategorySchema.parse({
    name: category.name,
    isPublished: category.isPublished,
    ...overrides,
  });
}

export function buildUpdateCategory(
  overrides: Partial<z.input<typeof UpdateCategorySchema>> = {},
): UpdateCategory {
  return UpdateCategorySchema.parse({
    ...buildCategory(),
    ...overrides,
  });
}
