import type { z } from 'zod';
import {
  type CatalogSection,
  CatalogSectionSchema,
} from './catalog-section.schema';
export function buildCatalogSection(
  overrides: Partial<z.input<typeof CatalogSectionSchema>> = {},
): CatalogSection {
  return CatalogSectionSchema.parse({
    id: '00000000-0000-4000-8000-000000000080',
    name: 'Nouveautés',
    themeId: null,
    packIds: [],
    ...overrides,
  });
}
