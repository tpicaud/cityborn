import type { ThemeIcon } from '@cityborn/api';
import { themeIconPaths, themeIconViewBox } from '@cityborn/design-system';

export function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  return (
    <svg
      viewBox={themeIconViewBox}
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
    >
      {themeIconPaths[icon].map((path: string) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
