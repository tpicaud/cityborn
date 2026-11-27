import { type CatalogSection, CatalogSectionSchema } from '@cityborn/api';
import type { CatalogSection as PrismaCatalogSection } from '@prisma/client';
import { defaultCatalogSectionId } from '../default-catalog-section';

export const CatalogSectionMapper = {
  toCatalogSection(prismaCatalogSection: PrismaCatalogSection): CatalogSection {
    return CatalogSectionSchema.parse({
      id: prismaCatalogSection.id,
      name: prismaCatalogSection.name,
      isDefault: prismaCatalogSection.id === defaultCatalogSectionId,
    });
  },
};
