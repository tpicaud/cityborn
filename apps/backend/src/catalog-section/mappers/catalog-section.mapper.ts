import { type CatalogSection, CatalogSectionSchema } from '@cityborn/api';
import type {
  CatalogSection as PrismaCatalogSection,
  CatalogSectionPack as PrismaCatalogSectionPack,
} from '@prisma/client';
import { defaultCatalogSectionId } from '../default-catalog-section';

export type PrismaCatalogSectionWithPacks = PrismaCatalogSection & {
  packs: Pick<PrismaCatalogSectionPack, 'packId'>[];
};

export const CatalogSectionMapper = {
  toCatalogSection(
    prismaCatalogSection: PrismaCatalogSectionWithPacks,
  ): CatalogSection {
    return CatalogSectionSchema.parse({
      id: prismaCatalogSection.id,
      name: prismaCatalogSection.name,
      isDefault: prismaCatalogSection.id === defaultCatalogSectionId,
      themeId: prismaCatalogSection.themeId,
      packIds: prismaCatalogSection.packs.map(({ packId }) => packId),
    });
  },
};
