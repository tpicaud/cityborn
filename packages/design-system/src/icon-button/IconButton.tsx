import type { ComponentType } from 'react';
import { styled } from 'tamagui';
import { PressableFrame } from '../PressableFrame';
import {
  type CommonIcon,
  type CommonIconImageProps,
  useCommonIconImage,
} from './commonIcons';

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
  const CommonIconImage: ComponentType<CommonIconImageProps> =
    useCommonIconImage();
  const { width, height }: IconSize = iconSizes[icon];

  return (
    <IconButtonFrame aria-label={label} onPress={onPress}>
      <CommonIconImage icon={icon} width={width} height={height} />
    </IconButtonFrame>
  );
}
