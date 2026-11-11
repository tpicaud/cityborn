import type { ComponentType } from 'react';
import { Image, styled, Text, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from './assetImage';
import { Button } from './Button';
import { verticalGradient } from './palette';

const visualAspectRatio: number = 137 / 118;

const monogramAspectRatio: number = 189 / 156;

type ImageCardProps = {
  title: string;
  imageUrl: string | undefined;
  onImageError: () => void;
  actionLabel: string;
  onAction: () => void | Promise<void>;
};

const ImageCardFrame = styled(View, {
  overflow: 'hidden',
  rounded: '6 md:10',
  backgroundColor: 'card-fill',
  boxShadow: 'card md:card-tablet',
});

const Visual = styled(View, {
  position: 'relative',
  w: '100%',
  aspectRatio: visualAspectRatio,
  items: 'center',
  justify: 'center',
});

const VisualFade = styled(View, {
  position: 'absolute',
  l: '0',
  r: '0',
  b: '0',
  h: '45%',
  backgroundImage: verticalGradient('card-fade'),
  pointerEvents: 'none',
});

const NeutralVisual = styled(View, {
  w: '40%',
  aspectRatio: monogramAspectRatio,
  opacity: 0.5,
});

const Body = styled(View, {
  position: 'relative',
  gap: '3 md:6',
  mt: '-5 md:-12',
  px: '4 md:10',
  pb: '1.5 md:3.5',
});

const Title = styled(Text, {
  fontFamily: 'body',
  fontSize: '3 md:8',
  lineHeight: '3 md:8',
  fontWeight: '600',
  color: 'white',
  text: 'center',
  textTransform: 'uppercase',
});

export function ImageCard({
  title,
  imageUrl,
  onImageError,
  actionLabel,
  onAction,
}: ImageCardProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <ImageCardFrame>
      <Visual>
        {imageUrl === undefined ? (
          <NeutralVisual>
            <AssetImage asset="monogram" />
          </NeutralVisual>
        ) : (
          <Image
            src={imageUrl}
            alt=""
            objectFit="cover"
            w="100%"
            h="100%"
            onError={onImageError}
          />
        )}
        <VisualFade />
      </Visual>
      <Body>
        <Title>{title}</Title>
        <Button small label={actionLabel} onPress={onAction} />
      </Body>
    </ImageCardFrame>
  );
}
