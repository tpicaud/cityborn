import type { CatalogSection } from '@cityborn/api';

export function isCatalogSectionDeletable(section: CatalogSection): boolean {
  return !section.isDefault;
}
