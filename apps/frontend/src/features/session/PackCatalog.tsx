'use client';

import type { Pack, Theme, ThemeIcon } from '@cityborn/api';
import {
  type PackImageFallback,
  type ThemeFilteredPacks,
  usePackImageFallback,
  useThemeFilteredPacks,
} from '@cityborn/client/session';
import {
  BodyText,
  CardGrid,
  FilterBar,
  FilterTag,
  ImageCard,
  LoadingScreen,
  Screen,
} from '@cityborn/design-system';
import { View } from 'tamagui';

type PackCatalogProps = {
  onPlay: (pack: Pack) => Promise<void>;
};

function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  const mask: string = `url("data:image/svg+xml,${encodeURIComponent(icon.svg)}") center / contain no-repeat`;

  return (
    <View
      disableOptimization
      w="100%"
      h="100%"
      bg="white"
      style={{ mask, WebkitMask: mask }}
    />
  );
}

function PackCard({
  pack,
  onPlay,
}: {
  pack: Pack;
  onPlay: (pack: Pack) => Promise<void>;
}) {
  const { imageUrl, showNeutralImage }: PackImageFallback =
    usePackImageFallback({ pack });

  return (
    <ImageCard
      title={pack.name}
      imageUrl={imageUrl}
      onImageError={showNeutralImage}
      actionLabel="Jouer"
      onAction={() => onPlay(pack)}
    />
  );
}

export function PackCatalog({ onPlay }: PackCatalogProps) {
  const {
    isLoading,
    themes,
    selectedTheme,
    selectTheme,
    packs,
  }: ThemeFilteredPacks = useThemeFilteredPacks();

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen
      title={selectedTheme?.name ?? 'Solo'}
      onBack={selectedTheme ? () => selectTheme(undefined) : undefined}
    >
      <View flex={1} minH="0" gap="4 md:5">
        <FilterBar label="Filtrer les packs par thème">
          <FilterTag
            label="Tous"
            selected={selectedTheme === undefined}
            onPress={() => selectTheme(undefined)}
          />
          {themes.map((theme: Theme) => (
            <FilterTag
              key={theme.id}
              label={theme.name}
              icon={<ThemeIconGlyph icon={theme.icon} />}
              selected={theme.id === selectedTheme?.id}
              onPress={() => selectTheme(theme.id)}
            />
          ))}
        </FilterBar>
        {packs.length === 0 ? (
          <BodyText disableOptimization>
            Aucun pack pour l’instant. Reviens vite !
          </BodyText>
        ) : (
          <CardGrid>
            {packs.map((pack: Pack) => (
              <PackCard key={pack.id} pack={pack} onPlay={onPlay} />
            ))}
          </CardGrid>
        )}
      </View>
    </Screen>
  );
}
