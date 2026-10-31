import type { Pack, ThemeId } from '@cityborn/api';

export function selectThemePacks({
  packs,
  themeId,
}: {
  packs: Pack[];
  themeId: ThemeId | undefined;
}): Pack[] {
  return packs
    .filter((pack: Pack) => themeId === undefined || pack.themeId === themeId)
    .toSorted((first: Pack, second: Pack) =>
      first.name.localeCompare(second.name, 'fr'),
    );
}
