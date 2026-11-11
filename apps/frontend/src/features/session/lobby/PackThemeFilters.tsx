import type { Theme, ThemeIcon } from '@cityborn/api';
import type { PackSelection } from '@cityborn/client/session';
import { Chip } from '@mui/material';

type PackThemeFiltersProps = Pick<
  PackSelection,
  'themes' | 'selectedTheme' | 'selectTheme'
>;

function ThemeIconGlyph({
  icon,
  className,
}: {
  icon: ThemeIcon;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        width: 18,
        height: 18,
        backgroundColor: 'currentColor',
        mask: `url("data:image/svg+xml,${encodeURIComponent(icon.svg)}") center / contain no-repeat`,
      }}
    />
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
