import type { z } from 'zod';
import {
  type CatalogSection,
  CatalogSectionSchema,
} from './catalog-section.schema';

export function buildCatalogSection(
  overrides: Partial<z.input<typeof CatalogSectionSchema>> = {},
): CatalogSection {
  return CatalogSectionSchema.parse({
    id: '6f1c2d4e-8a3b-4c5d-9e7f-0a1b2c3d4e5f',
    name: 'Nouveautés',
    ...overrides,
  });
}
