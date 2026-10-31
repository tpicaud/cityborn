import type { Theme, ThemeIcon } from '@cityborn/api';
import type { PackSelection } from '@cityborn/client/session';
import {
  colors,
  themeIconPaths,
  themeIconViewBox,
} from '@cityborn/design-system';
import { Pressable, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui/native/NativeComponents';
import { cn } from '@/lib/classNames';

type PackThemeFiltersProps = Pick<
  PackSelection,
  'themes' | 'selectedTheme' | 'selectTheme'
>;

function ThemeIconGlyph({ icon, color }: { icon: ThemeIcon; color: string }) {
  return (
    <Svg viewBox={themeIconViewBox} width={16} height={16} fill={color}>
      {themeIconPaths[icon].map((path: string) => (
        <Path key={path} d={path} />
      ))}
    </Svg>
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
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={cn(
        'flex-row items-center gap-2 h-9 px-4 rounded-full border-2 border-primary-500',
        isSelected ? 'bg-primary-500' : 'bg-transparent',
      )}
    >
      <Text className={isSelected ? 'text-zinc-50' : 'text-primary-500'}>
        {label}
      </Text>
      {icon && (
        <ThemeIconGlyph
          icon={icon}
          color={isSelected ? colors.background.DEFAULT : colors.primary[500]}
        />
      )}
    </Pressable>
  );
}

export function PackThemeFilters({
  themes,
  selectedTheme,
  selectTheme,
}: PackThemeFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      className="grow-0"
    >
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
    </ScrollView>
  );
}
