import type { ComponentType } from 'react';
import { Image, styled, Text, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';

const photoAspectRatio: number = 122 / 149;

const monogramAspectRatio: number = 189 / 156;

type PersonalityCardProps = {
  name: string;
  imageUrl: string | undefined;
};

const CardFrame = styled(View, {
  w: '32 md:52',
  pt: '1 md:2',
  px: '1 md:1.5',
  rounded: '6 md:9',
  bg: 'mid-blue',
  boxShadow: 'personality-card md:personality-card-tablet',
});

const Photo = styled(View, {
  w: '100%',
  aspectRatio: photoAspectRatio,
  overflow: 'hidden',
  items: 'center',
  justify: 'center',
  rounded: 'xl md:7',
  bg: 'card-fill',
});

const NeutralPhoto = styled(View, {
  w: '50%',
  aspectRatio: monogramAspectRatio,
  opacity: 0.5,
});

const Name = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:7',
  lineHeight: '4 md:7',
  fontWeight: '600',
  color: 'secondary-cyan',
  text: 'center',
  py: '2 md:3',
});

export function PersonalityCard({ name, imageUrl }: PersonalityCardProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <CardFrame>
      <Photo>
        {imageUrl === undefined ? (
          <NeutralPhoto>
            <AssetImage asset="monogram" />
          </NeutralPhoto>
        ) : (
          <Image
            src={imageUrl}
            alt={name}
            objectFit="cover"
            w="100%"
            h="100%"
          />
        )}
      </Photo>
      <Name>{name}</Name>
    </CardFrame>
  );
}
