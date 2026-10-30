import type { ComponentType } from 'react';
import { styled, View } from 'tamagui';
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

const IconButtonFrame = styled(View, {
  role: 'button',
  render: <button type="button" />,
  tabIndex: 0,
  items: 'center',
  justify: 'center',
  p: '0',
  borderWidth: '0',
  backgroundColor: 'transparent',
  cursor: 'web:pointer',
  rounded: 'full',
  scale: 'press:0.92',
  opacity: 'press:0.85',
  outlineColor: 'focus-visible:white',
  outlineStyle: 'focus-visible:solid',
  outlineWidth: 'focus-visible:2px',
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
