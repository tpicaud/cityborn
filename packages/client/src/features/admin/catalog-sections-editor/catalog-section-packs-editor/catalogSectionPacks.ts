import type { CatalogSection, Pack, PackId } from '@cityborn/api';

function normalizePackName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .trim();
}

export function areCatalogSectionPacksEditable(
  section: CatalogSection,
): boolean {
  return !section.isDefault;
}

export function selectCatalogSectionPacks({
  section,
  packs,
}: {
  section: CatalogSection;
  packs: Pack[];
}): Pack[] {
  const packsById: Map<PackId, Pack> = new Map(
    packs.map((pack: Pack) => [pack.id, pack]),
  );
  return section.packIds.flatMap((packId: PackId) => {
    const pack: Pack | undefined = packsById.get(packId);
    return pack ? [pack] : [];
  });
}

export function searchCatalogSectionPackCandidates({
  section,
  packs,
  query,
}: {
  section: CatalogSection;
  packs: Pack[];
  query: string;
}): Pack[] {
  const normalizedQuery: string = normalizePackName(query);
  return packs
    .filter(
      (pack: Pack) =>
        (section.themeId === null || pack.themeId === section.themeId) &&
        !section.packIds.includes(pack.id) &&
        normalizePackName(pack.name).includes(normalizedQuery),
    )
    .sort((first: Pack, second: Pack) =>
      first.name.localeCompare(second.name, 'fr'),
    );
}
