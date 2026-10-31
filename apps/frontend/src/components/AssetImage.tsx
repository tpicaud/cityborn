import type { AssetImageProps, ImageAsset } from '@cityborn/design-system';
import phoneBackground from '@cityborn/design-system/assets/backgrounds/phone.jpg';
import tabletBackground from '@cityborn/design-system/assets/backgrounds/tablet.jpg';
import backIcon from '@cityborn/design-system/assets/common/back.svg';
import closeIcon from '@cityborn/design-system/assets/common/close.svg';
import optionsIcon from '@cityborn/design-system/assets/common/options.svg';
import monogram from '@cityborn/design-system/assets/monogram.svg';
import collectionIcon from '@cityborn/design-system/assets/navigation/collection.svg';
import collectionPressedIcon from '@cityborn/design-system/assets/navigation/collection-pressed.svg';
import homeIcon from '@cityborn/design-system/assets/navigation/home.svg';
import homePressedIcon from '@cityborn/design-system/assets/navigation/home-pressed.svg';
import profileIcon from '@cityborn/design-system/assets/navigation/profile.svg';
import profilePressedIcon from '@cityborn/design-system/assets/navigation/profile-pressed.svg';
import socialIcon from '@cityborn/design-system/assets/navigation/social.svg';
import socialPressedIcon from '@cityborn/design-system/assets/navigation/social-pressed.svg';
import Image, { type StaticImageData } from 'next/image';

const assetSources: Record<ImageAsset, StaticImageData> = {
  'common/back': backIcon,
  'common/close': closeIcon,
  'common/options': optionsIcon,
  'navigation/home': homeIcon,
  'navigation/home-pressed': homePressedIcon,
  'navigation/collection': collectionIcon,
  'navigation/collection-pressed': collectionPressedIcon,
  'navigation/social': socialIcon,
  'navigation/social-pressed': socialPressedIcon,
  'navigation/profile': profileIcon,
  'navigation/profile-pressed': profilePressedIcon,
  'backgrounds/phone': phoneBackground,
  'backgrounds/tablet': tabletBackground,
  monogram,
};

export function AssetImage({ asset }: AssetImageProps) {
  return (
    <Image
      src={assetSources[asset]}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
