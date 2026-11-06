import type { ComponentType, ReactNode } from 'react';
import { ScrollView, styled, Text, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';
import { Screen } from './Screen';

type LogoSize = {
  width: number;
  height: number;
};

const phoneLogoSize: LogoSize = { width: 156, height: 162 };

const tabletLogoSize: LogoSize = { width: 244, height: 253 };

const tabletActionsWidth: number = 560;

const Logo = styled(View, {
  self: 'center',
  mt: '5 md:28',
  w: `${phoneLogoSize.width}px md:${tabletLogoSize.width}px`,
  h: `${phoneLogoSize.height}px md:${tabletLogoSize.height}px`,
});

const Separator = styled(View, {
  mt: '11 md:16',
  mx: '-4 md:-10',
  borderTopWidth: '1',
  borderBottomWidth: '1',
  borderTopColor: 'separator-shade',
  borderBottomColor: 'separator-light',
});

const Headline = styled(View, {
  items: 'center',
  gap: '1.5 md:2.5',
  mt: '8 md:14',
});

const HeadlineKicker = styled(Text, {
  fontFamily: 'heading',
  fontSize: '8 md:11',
  lineHeight: '8 md:11',
  fontWeight: '700',
  color: 'headline-kicker',
  text: 'center',
});

const HeadlineTitle = styled(Text, {
  role: 'heading',
  fontFamily: 'heading',
  fontSize: '10 md:12',
  lineHeight: '10 md:12',
  fontWeight: '700',
  color: 'white',
  text: 'center',
});

const Actions = styled(View, {
  self: 'center',
  w: '100%',
  maxW: tabletActionsWidth,
  gap: '11 md:16',
  mt: '8 md:12',
  px: '1.5 md:0',
});

const ActionGroupFrame = styled(View, {
  gap: '2.5 md:4',
});

type BrandScreenProps = {
  kicker?: string;
  title: string;
  children: ReactNode;
};

export function BrandScreen({ kicker, title, children }: BrandScreenProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <Screen>
      <ScrollView
        flex={1}
        mx="-4 md:-10"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View px="4 md:10" pb="4 md:6">
          <Logo role="img" aria-label="Cityborn">
            <AssetImage asset="logo" />
          </Logo>
          <Separator />
          <Headline>
            {kicker !== undefined && <HeadlineKicker>{kicker}</HeadlineKicker>}
            <HeadlineTitle>{title}</HeadlineTitle>
          </Headline>
          <Actions>{children}</Actions>
        </View>
      </ScrollView>
    </Screen>
  );
}

type ActionGroupProps = {
  children: ReactNode;
};

export function ActionGroup({ children }: ActionGroupProps) {
  return <ActionGroupFrame>{children}</ActionGroupFrame>;
}
