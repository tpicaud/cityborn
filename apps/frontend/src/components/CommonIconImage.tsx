import type { CommonIcon, CommonIconImageProps } from '@cityborn/design-system';
import backIcon from '@cityborn/design-system/assets/common/back.svg';
import closeIcon from '@cityborn/design-system/assets/common/close.svg';
import optionsIcon from '@cityborn/design-system/assets/common/options.svg';
import Image, { type StaticImageData } from 'next/image';

const commonIconSources: Record<CommonIcon, StaticImageData> = {
  back: backIcon,
  close: closeIcon,
  options: optionsIcon,
};

export function CommonIconImage({ icon, width, height }: CommonIconImageProps) {
  return (
    <Image src={commonIconSources[icon]} alt="" width={width} height={height} />
  );
}
