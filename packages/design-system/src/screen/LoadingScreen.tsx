import type { ComponentType } from 'react';
import { View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';
import { ScreenFrame } from './ScreenFrame';

type MonogramSize = {
  width: number;
  height: number;
};

const monogramSize: MonogramSize = { width: 189, height: 156 };

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
        <View w={monogramSize.width} h={monogramSize.height}>
          <AssetImage asset="monogram" />
        </View>
      </View>
    </ScreenFrame>
  );
}
