import type { CatalogSection } from '@cityborn/api';

const fallbackAllPacksRowTitle: string = 'Tous les packs';

export function findAllPacksRowTitle(sections: CatalogSection[]): string {
  return (
    sections.find((section: CatalogSection) => section.isDefault)?.name ??
    fallbackAllPacksRowTitle
  );
}
