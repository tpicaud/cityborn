import {
  type CatalogSection,
  CatalogSectionIdSchema,
  PackIdSchema,
  ThemeIdSchema,
} from '@cityborn/api';
import type {
  CatalogSectionPack,
  CatalogSection as PrismaCatalogSection,
} from '@prisma/client';
export type CatalogSectionRow = PrismaCatalogSection & {
  packs: CatalogSectionPack[];
};
export function toCatalogSection(section: CatalogSectionRow): CatalogSection {
  return {
    id: CatalogSectionIdSchema.parse(section.id),
    name: section.name,
    themeId:
      section.themeId === null ? null : ThemeIdSchema.parse(section.themeId),
    packIds: section.packs.map(({ packId }) => PackIdSchema.parse(packId)),
  };
}
