import type { CatalogSection, Pack, PackId, ThemeId } from '@cityborn/api';
import { selectThemePacks } from './themePacks';

export type CatalogRow = {
  key: string;
  title: string;
  packs: Pack[];
};

const fallbackAllPacksRowTitle: string = 'Tous les packs';

function selectSectionPacks({
  section,
  packsById,
}: {
  section: CatalogSection;
  packsById: Map<PackId, Pack>;
}): Pack[] {
  return section.packIds.flatMap((packId: PackId) => {
    const pack: Pack | undefined = packsById.get(packId);
    return pack ? [pack] : [];
  });
}

export function createCatalogRows({
  sections,
  publishedPacks,
  themeId,
}: {
  sections: CatalogSection[];
  publishedPacks: Pack[];
  themeId: ThemeId | undefined;
}): CatalogRow[] {
  const defaultSection: CatalogSection | undefined = sections.find(
    (section: CatalogSection) => section.isDefault,
  );
  const allPacksRow: CatalogRow = {
    key: themeId ?? 'all',
    title: defaultSection?.name ?? fallbackAllPacksRowTitle,
    packs: selectThemePacks({ packs: publishedPacks, themeId }),
  };
  if (allPacksRow.packs.length === 0) return [];
  const packsById: Map<PackId, Pack> = new Map(
    publishedPacks.map((pack: Pack) => [pack.id, pack]),
  );
  const filterRows: CatalogRow[] = sections
    .filter((section: CatalogSection) => section.themeId === (themeId ?? null))
    .map(
      (section: CatalogSection): CatalogRow =>
        section.isDefault
          ? allPacksRow
          : {
              key: section.id,
              title: section.name,
              packs: selectSectionPacks({ section, packsById }),
            },
    );
  const rows: CatalogRow[] =
    themeId === undefined && defaultSection
      ? filterRows
      : [...filterRows, allPacksRow];
  return rows.filter((row: CatalogRow) => row.packs.length > 0);
}
