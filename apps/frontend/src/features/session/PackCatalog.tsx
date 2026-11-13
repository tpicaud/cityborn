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
  CardRow,
  FilterBar,
  FilterTag,
  ImageCard,
  LoadingScreen,
  Screen,
  TextButton,
} from '@cityborn/design-system';
import { ScrollView, View } from 'tamagui';

type PackCatalogProps = {
  onPlay: (pack: Pack) => Promise<void>;
  bottomSafeArea?: boolean;
};

function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  const mask: string = `url("data:image/svg+xml,${encodeURIComponent(icon.svg)}") center / contain no-repeat`;
  return (
    <View w="100%" h="100%" bg="white" style={{ mask, WebkitMask: mask }} />
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

export function PackCatalog({ onPlay, bottomSafeArea }: PackCatalogProps) {
  const {
    isLoading,
    themes,
    selectedTheme,
    selectTheme,
    sections,
    hasSectionsError,
    isReloadingSections,
    reloadSections,
  }: ThemeFilteredPacks = useThemeFilteredPacks();

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen title="Solo" bottomSafeArea={bottomSafeArea}>
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
        {hasSectionsError && (
          <View role="alert">
            <BodyText>
              Les sections n’ont pas pu être chargées. Tous les packs restent
              accessibles.
            </BodyText>
            <TextButton
              label="Réessayer"
              onPress={reloadSections}
              disabled={isReloadingSections}
            />
          </View>
        )}
        {sections.length === 0 ? (
          <BodyText>Aucun pack pour l’instant. Reviens vite !</BodyText>
        ) : (
          <ScrollView flex={1} minH="0" showsVerticalScrollIndicator>
            <View gap="5 md:8" pb="4 md:6">
              {sections.map((section) => (
                <CardRow key={section.id} title={section.name}>
                  {section.packs.map((pack: Pack) => (
                    <PackCard key={pack.id} pack={pack} onPlay={onPlay} />
                  ))}
                </CardRow>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
