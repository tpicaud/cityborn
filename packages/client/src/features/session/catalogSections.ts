import type { CatalogSection, Pack, ThemeId } from '@cityborn/api';
import { selectThemePacks } from './themePacks';
export type PackCatalogSection = { id: string; name: string; packs: Pack[] };
export function createPackCatalogSections({
  sections,
  packs,
  themeId,
}: {
  sections: CatalogSection[];
  packs: Pack[];
  themeId: ThemeId | undefined;
}): PackCatalogSection[] {
  const filteredPacks: Pack[] = selectThemePacks({
    packs: packs.filter((pack) => pack.isPublished),
    themeId,
  });
  if (filteredPacks.length === 0) return [];
  const packsById: ReadonlyMap<Pack['id'], Pack> = new Map(
    filteredPacks.map((pack) => [pack.id, pack]),
  );
  return [
    ...sections
      .filter((section) => section.themeId === (themeId ?? null))
      .map(
        (section): PackCatalogSection => ({
          id: section.id,
          name: section.name,
          packs: section.packIds.flatMap((id) => {
            const pack: Pack | undefined = packsById.get(id);
            return pack ? [pack] : [];
          }),
        }),
      )
      .filter((section) => section.packs.length > 0),
    { id: 'all-packs', name: 'Tous les packs', packs: filteredPacks },
  ];
}
