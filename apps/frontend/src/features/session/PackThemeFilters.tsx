import type { Theme, ThemeIcon } from '@cityborn/api';
import type { PackSelection } from '@cityborn/client/session';
import { themeIconPaths, themeIconViewBox } from '@cityborn/design-system';
import { Chip, SvgIcon } from '@mui/material';

type PackThemeFiltersProps = Pick<
  PackSelection,
  'themes' | 'selectedTheme' | 'selectTheme'
>;

function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  return (
    <SvgIcon viewBox={themeIconViewBox} fontSize="small">
      {themeIconPaths[icon].map((path: string) => (
        <path key={path} d={path} />
      ))}
    </SvgIcon>
  );
}

function ThemeFilter({
  label,
  icon,
  isSelected,
  onSelect,
}: {
  label: string;
  icon?: ThemeIcon;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Chip
      label={label}
      icon={icon ? <ThemeIconGlyph icon={icon} /> : undefined}
      color={isSelected ? 'primary' : 'default'}
      variant={isSelected ? 'filled' : 'outlined'}
      aria-pressed={isSelected}
      onClick={onSelect}
      sx={{ flexShrink: 0 }}
    />
  );
}

export function PackThemeFilters({
  themes,
  selectedTheme,
  selectTheme,
}: PackThemeFiltersProps) {
  return (
    <fieldset className="flex min-w-0 gap-2 overflow-x-auto pb-1">
      <legend className="sr-only">Filtrer les packs par thème</legend>
      <ThemeFilter
        label="Tous"
        isSelected={selectedTheme === undefined}
        onSelect={() => selectTheme(undefined)}
      />
      {themes.map((theme: Theme) => (
        <ThemeFilter
          key={theme.id}
          label={theme.name}
          icon={theme.icon}
          isSelected={theme.id === selectedTheme?.id}
          onSelect={() => selectTheme(theme.id)}
        />
      ))}
    </fieldset>
  );
}
