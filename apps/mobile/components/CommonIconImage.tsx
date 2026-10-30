import type { CommonIcon, CommonIconImageProps } from '@cityborn/design-system';
import { Image } from 'expo-image';

const commonIconSources: Record<CommonIcon, number> = {
  back: require('@cityborn/design-system/assets/common/back.svg'),
  close: require('@cityborn/design-system/assets/common/close.svg'),
  options: require('@cityborn/design-system/assets/common/options.svg'),
};

export function CommonIconImage({ icon, width, height }: CommonIconImageProps) {
  return (
    <Image
      source={commonIconSources[icon]}
      style={{ width, height }}
      contentFit="contain"
      accessible={false}
    />
  );
}
