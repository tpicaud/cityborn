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

function isPackInSectionFilter({
  section,
  pack,
}: {
  section: CatalogSection;
  pack: Pack;
}): boolean {
  return section.themeId === null || pack.themeId === section.themeId;
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
        isPackInSectionFilter({ section, pack }) &&
        !section.packIds.includes(pack.id) &&
        normalizePackName(pack.name).includes(normalizedQuery),
    )
    .sort((first: Pack, second: Pack) =>
      first.name.localeCompare(second.name, 'fr'),
    );
}

export function createEmptyPackCandidatesMessage({
  section,
  packs,
}: {
  section: CatalogSection;
  packs: Pack[];
}): string {
  const filterPacks: Pack[] = packs.filter((pack: Pack) =>
    isPackInSectionFilter({ section, pack }),
  );
  const scope: string = section.themeId === null ? '' : ' de ce thème';
  if (filterPacks.length === 0) return `Aucun pack${scope} disponible.`;
  if (filterPacks.every((pack: Pack) => section.packIds.includes(pack.id)))
    return `Tous les packs${scope} sont déjà dans la section.`;
  return `Aucun pack${scope} ne correspond à la recherche.`;
}
