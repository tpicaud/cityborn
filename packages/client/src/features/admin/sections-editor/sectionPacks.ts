import type { CatalogSection, Pack } from '@cityborn/api';
export function selectSectionPackCandidates({
  section,
  packs,
  search,
}: {
  section: CatalogSection;
  packs: Pack[];
  search: string;
}): Pack[] {
  const term: string = search.trim().toLocaleLowerCase('fr');
  return packs
    .filter(
      (pack) =>
        (section.themeId === null || pack.themeId === section.themeId) &&
        !section.packIds.includes(pack.id) &&
        pack.name.toLocaleLowerCase('fr').includes(term),
    )
    .sort((first, second) => first.name.localeCompare(second.name, 'fr'));
}
export function selectSectionPacks({
  section,
  packs,
}: {
  section: CatalogSection;
  packs: Pack[];
}): Pack[] {
  const byId: ReadonlyMap<Pack['id'], Pack> = new Map(
    packs.map((pack) => [pack.id, pack]),
  );
  return section.packIds.flatMap((id) => {
    const pack: Pack | undefined = byId.get(id);
    return pack ? [pack] : [];
  });
}
