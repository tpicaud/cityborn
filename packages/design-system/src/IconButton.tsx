import type { ComponentType } from 'react';
import { styled, View } from 'tamagui';
import {
  type AssetImageProps,
  type CommonIcon,
  useAssetImage,
} from './assetImage';
import { PressableFrame } from './PressableFrame';

type IconSize = {
  width: number;
  height: number;
};

const iconSizes: Record<CommonIcon, IconSize> = {
  back: { width: 60.8, height: 59.8 },
  close: { width: 40, height: 40 },
  options: { width: 52, height: 52 },
};

type IconButtonProps = {
  icon: CommonIcon;
  label: string;
  onPress: () => void;
};

const IconButtonFrame = styled(PressableFrame, {
  items: 'center',
  justify: 'center',
  p: '0',
  backgroundColor: 'transparent',
  rounded: 'full',
  scale: 'press:0.92',
  opacity: 'press:0.85',
});

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();
  const { width, height }: IconSize = iconSizes[icon];

  return (
    <IconButtonFrame aria-label={label} onPress={onPress}>
      <View w={width} h={height}>
        <AssetImage asset={`common/${icon}`} />
      </View>
    </IconButtonFrame>
  );
}
