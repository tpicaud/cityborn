import type { Pack, Theme, ThemeIcon } from '@cityborn/api';
import {
  type CatalogRow,
  type PackImageFallback,
  type ThemeFilteredPacks,
  usePackImageFallback,
  useThemeFilteredPacks,
} from '@cityborn/client/session';
import {
  BodyText,
  Button,
  CardRow,
  FilterBar,
  FilterTag,
  ImageCard,
  LoadingScreen,
  Screen,
} from '@cityborn/design-system';
import { SvgXml } from 'react-native-svg';
import { View } from 'tamagui';

type PackCatalogProps = {
  onPlay: (pack: Pack) => Promise<void>;
  isScreenFocused?: boolean;
  bottomSafeArea?: boolean;
};

function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  return <SvgXml xml={icon.svg} width="100%" height="100%" color="white" />;
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

export function PackCatalog({
  onPlay,
  isScreenFocused,
  bottomSafeArea,
}: PackCatalogProps) {
  const {
    isLoading,
    themes,
    selectedTheme,
    selectTheme,
    catalogRows,
    catalogSectionsLoadFailed,
    reloadCatalogSections,
  }: ThemeFilteredPacks = useThemeFilteredPacks({ isScreenFocused });

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen title="Solo" bottomSafeArea={bottomSafeArea} scrollable>
      <View gap="4 md:5">
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
        {catalogRows.length === 0 ? (
          <BodyText>Aucun pack pour l’instant. Reviens vite !</BodyText>
        ) : (
          catalogRows.map((row: CatalogRow) => (
            <CardRow key={row.key} title={row.title}>
              {row.packs.map((pack: Pack) => (
                <PackCard key={pack.id} pack={pack} onPlay={onPlay} />
              ))}
            </CardRow>
          ))
        )}
        {catalogSectionsLoadFailed && (
          <View gap="2" items="flex-start">
            <BodyText>
              Les sections du catalogue n’ont pas pu être chargées.
            </BodyText>
            <Button
              compact
              variant="outline"
              label="Réessayer"
              onPress={reloadCatalogSections}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
