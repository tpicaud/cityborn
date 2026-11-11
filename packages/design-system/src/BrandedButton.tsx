import { type ComponentType, useState } from 'react';
import { Spinner, styled, View } from 'tamagui';
import {
  type AssetImageProps,
  type ImageAsset,
  useAssetImage,
} from './assetImage';
import { BodyText } from './BodyText';
import { PressableFrame } from './PressableFrame';

const BrandedButtonFrame = styled(PressableFrame, {
  flexDirection: 'row',
  items: 'center',
  justify: 'center',
  gap: '2.5 md:3',
  px: '4 md:5',
  py: '2 md:3',
  minH: '11 md:16',
  rounded: 'full',
  bg: 'white',
  borderWidth: '2',
  borderColor: 'cta-backdrop',
});

type BrandedButtonProps = {
  label: string;
  icon: ImageAsset;
  onPress: () => Promise<void>;
};

export function BrandedButton({ label, icon, onPress }: BrandedButtonProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();
  const [pending, setPending] = useState<boolean>(false);
  const press: () => Promise<void> = async () => {
    setPending(true);
    try {
      await onPress();
    } finally {
      setPending(false);
    }
  };
  return (
    <BrandedButtonFrame
      onPress={pending ? undefined : press}
      aria-label={label}
      aria-disabled={pending}
      aria-busy={pending}
    >
      <View w="5 md:7" h="5 md:7">
        {pending ? <Spinner color="black" /> : <AssetImage asset={icon} />}
      </View>
      <BodyText color="black" fontSize="5 md:7">
        {label}
      </BodyText>
    </BrandedButtonFrame>
  );
}
