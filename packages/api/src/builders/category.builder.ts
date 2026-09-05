import type {
  Category,
  CreateCategory,
  UpdateCategory,
} from '../schemas/category.schema';

export function buildCategory(overrides: Partial<Category> = {}): Category {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Monuments',
    isPublished: true,
    ...overrides,
  });
}

export function buildCreateCategory(
  overrides: Partial<CreateCategory> = {},
): CreateCategory {
  const category = buildCategory();

  return structuredClone({
    name: category.name,
    isPublished: category.isPublished,
    ...overrides,
  });
}

export function buildUpdateCategory(
  overrides: Partial<UpdateCategory> = {},
): UpdateCategory {
  return structuredClone({
    ...buildCategory(),
    ...overrides,
  });
}
