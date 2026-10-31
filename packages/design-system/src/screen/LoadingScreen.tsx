import type { ComponentType } from 'react';
import { View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';
import { ScreenFrame } from './ScreenFrame';

export function LoadingScreen() {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <ScreenFrame>
      <View
        flex={1}
        items="center"
        justify="center"
        role="progressbar"
        aria-label="Chargement"
      >
        <View w={189} h={156}>
          <AssetImage asset="monogram" />
        </View>
      </View>
    </ScreenFrame>
  );
}
