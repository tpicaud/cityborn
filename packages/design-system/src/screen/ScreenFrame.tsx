import type { ComponentType, ReactNode } from 'react';
import { styled, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';

const phoneMockupRatio: number = 402 / 874;

const tabletMockupRatio: number = 1024 / 1366;

const Frame = styled(View, {
  position: 'relative',
  flex: 1,
  h: '100%',
  backgroundColor: 'mid-blue',
  overflow: 'hidden',
});

const Backdrop = styled(View, {
  position: 'absolute',
  t: '0',
  l: '0',
  r: '0',
  pointerEvents: 'none',
});

const Content = styled(View, {
  position: 'relative',
  flex: 1,
});

type ScreenFrameProps = {
  children: ReactNode;
};

export function ScreenFrame({ children }: ScreenFrameProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <Frame>
      <Backdrop aspectRatio={phoneMockupRatio} display="flex md:none">
        <AssetImage asset="backgrounds/phone" />
      </Backdrop>
      <Backdrop aspectRatio={tabletMockupRatio} display="none md:flex">
        <AssetImage asset="backgrounds/tablet" />
      </Backdrop>
      <Content>{children}</Content>
    </Frame>
  );
}
