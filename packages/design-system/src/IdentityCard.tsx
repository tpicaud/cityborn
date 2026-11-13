import type { ComponentType } from 'react';
import { styled, Text, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from './assetImage';
import { Chevron } from './Chevron';
import { Panel } from './Panel';
import { PressableFrame } from './PressableFrame';
import { verticalGradient } from './palette';

const phoneGlobeSize: number = 220;

const tabletGlobeSize: number = 424;

type IdentityCardProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
};

const IdentityCardFrame = styled(Panel, {
  position: 'relative',
  overflow: 'hidden',
  gap: '0',
  pt: '3 md:5',
  px: '2 md:5',
  pb: '1.5 md:3',
  rounded: '2xl md:4xl',
});

const Globe = styled(View, {
  position: 'absolute',
  t: '-4 md:-8',
  r: '-20 md:-40',
  w: `${phoneGlobeSize}px md:${tabletGlobeSize}px`,
  h: `${phoneGlobeSize}px md:${tabletGlobeSize}px`,
  rotate: '5.69deg',
  opacity: 0.05,
  pointerEvents: 'none',
});

const IdentityLines = styled(View, {
  gap: '2.5 md:4',
  px: '2.5 md:3',
});

const IdentityTitle = styled(Text, {
  fontFamily: 'heading',
  fontSize: '8 md:12',
  lineHeight: '8 md:12',
  fontWeight: '700',
  color: 'white',
  numberOfLines: 1,
});

const IdentitySubtitle = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '400',
  color: 'white',
  numberOfLines: 1,
});

const ActionSocket = styled(View, {
  self: 'flex-start',
  w: '62%',
  mt: '3 md:6',
  pb: '1',
  rounded: '6 md:4xl',
  borderWidth: '1 md:2',
  borderColor: 'cta-border',
  bg: 'cta-backdrop',
});

const ActionFace = styled(PressableFrame, {
  flexDirection: 'row',
  items: 'center',
  justify: 'space-between',
  gap: '2',
  h: '10 md:20',
  px: '4 md:8',
  rounded: '6 md:9',
  backgroundImage: verticalGradient('blue'),
  boxShadow:
    'relief-blue-slim press:relief-pressed-slim md:relief-blue md:press:relief-pressed',
  y: 'press:0.5 md:press:0.75',
});

const ActionLabel = styled(Text, {
  shrink: 1,
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '500',
  color: 'white',
  select: 'none',
});

export function IdentityCard({
  title,
  subtitle,
  actionLabel,
  onAction,
}: IdentityCardProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <IdentityCardFrame>
      <Globe>
        <AssetImage asset="decorations/globe" />
      </Globe>
      <IdentityLines>
        <IdentityTitle>{title}</IdentityTitle>
        <IdentitySubtitle>{subtitle}</IdentitySubtitle>
      </IdentityLines>
      <ActionSocket>
        <ActionFace onPress={onAction}>
          <ActionLabel>{actionLabel}</ActionLabel>
          <Chevron size="action" />
        </ActionFace>
      </ActionSocket>
    </IdentityCardFrame>
  );
}
