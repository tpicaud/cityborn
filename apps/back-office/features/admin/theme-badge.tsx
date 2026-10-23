import type { Theme, ThemeId } from '@cityborn/api';
import { findThemeName } from '@cityborn/client/admin';

type ThemeBadgeProps = {
  themes: Theme[];
  themeId: ThemeId;
};

export function ThemeBadge({ themes, themeId }: ThemeBadgeProps) {
  const themeName: string | undefined = findThemeName({ themes, themeId });
  if (!themeName) return null;

  return (
    <span className="w-fit px-2 py-0.5 text-xs rounded-full border border-sky-400 text-sky-300">
      {themeName}
    </span>
  );
}
