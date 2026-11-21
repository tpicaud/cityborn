import { type CatalogSection, CatalogSectionSchema } from '@cityborn/api';
import type { CatalogSection as PrismaCatalogSection } from '@prisma/client';

export const CatalogSectionMapper = {
  toCatalogSection(prismaCatalogSection: PrismaCatalogSection): CatalogSection {
    return CatalogSectionSchema.parse({
      id: prismaCatalogSection.id,
      name: prismaCatalogSection.name,
    });
  },
};
