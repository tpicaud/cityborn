import type { AssetImageProps, ImageAsset } from '@cityborn/design-system';
import { Image } from 'expo-image';

const assetSources: Record<ImageAsset, number> = {
  'common/back': require('@cityborn/design-system/assets/common/back.svg'),
  'common/close': require('@cityborn/design-system/assets/common/close.svg'),
  'common/options': require('@cityborn/design-system/assets/common/options.svg'),
  'navigation/home': require('@cityborn/design-system/assets/navigation/home.svg'),
  'navigation/home-pressed': require('@cityborn/design-system/assets/navigation/home-pressed.svg'),
  'navigation/collection': require('@cityborn/design-system/assets/navigation/collection.svg'),
  'navigation/collection-pressed': require('@cityborn/design-system/assets/navigation/collection-pressed.svg'),
  'navigation/social': require('@cityborn/design-system/assets/navigation/social.svg'),
  'navigation/social-pressed': require('@cityborn/design-system/assets/navigation/social-pressed.svg'),
  'navigation/profile': require('@cityborn/design-system/assets/navigation/profile.svg'),
  'navigation/profile-pressed': require('@cityborn/design-system/assets/navigation/profile-pressed.svg'),
  'backgrounds/phone': require('@cityborn/design-system/assets/backgrounds/phone.jpg'),
  'backgrounds/tablet': require('@cityborn/design-system/assets/backgrounds/tablet.jpg'),
  monogram: require('@cityborn/design-system/assets/monogram.svg'),
};

export function AssetImage({ asset }: AssetImageProps) {
  return (
    <Image
      source={assetSources[asset]}
      style={{ width: '100%', height: '100%' }}
      contentFit="contain"
      accessible={false}
    />
  );
}
