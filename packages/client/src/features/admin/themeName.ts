import type { Theme, ThemeId } from '@cityborn/api';

type ThemeNameLookup = {
  themes: Theme[];
  themeId: ThemeId;
};

export function findThemeName({
  themes,
  themeId,
}: ThemeNameLookup): string | undefined {
  return themes.find((theme: Theme) => theme.id === themeId)?.name;
}
