import {
  type ComponentType,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type GetRef,
  ScrollView,
  type ScrollViewProps,
  styled,
  Text,
  View,
  type ViewProps,
} from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';
import { Screen } from './Screen';

type LogoSize = {
  width: number;
  height: number;
};

const phoneLogoSize: LogoSize = { width: 156, height: 162 };

const tabletLogoSize: LogoSize = { width: 244, height: 253 };

const tabletActionsWidth: number = 560;
const tabletAdaptiveActionsWidth: number = 746;
const spaciousMinHeight: number = 768;

type Density = 'compact' | 'spacious' | undefined;

const Logo = styled(View, {
  self: 'center',
  mt: '5 md:28',
  w: `${phoneLogoSize.width}px md:${tabletLogoSize.width}px`,
  h: `${phoneLogoSize.height}px md:${tabletLogoSize.height}px`,
  variants: {
    density: {
      compact: { mt: '2', w: '24', h: '24' },
      spacious: { mt: '6 md:10', w: '32 md:40', h: '32 md:40' },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
});

const Separator = styled(View, {
  mt: '11 md:16',
  variants: {
    density: {
      compact: { mt: '3' },
      spacious: { mt: '6 md:8' },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
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
  variants: {
    density: {
      compact: { mt: '3' },
      spacious: { mt: '3 md:6' },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
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
  variants: {
    density: {
      compact: {
        maxW: tabletAdaptiveActionsWidth,
        mt: '4',
        px: '5 md:0',
        gap: '3',
      },
      spacious: {
        maxW: tabletAdaptiveActionsWidth,
        mt: '6 md:8',
        px: '5 md:0',
        gap: '6 md:10',
      },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
});

const ActionGroupFrame = styled(View, {
  gap: '2.5 md:4',
});

type BrandScreenProps = {
  kicker?: string;
  title: string;
  children: ReactNode;
  adaptiveDensity?: boolean;
  bottomSafeArea?: boolean;
};

export function BrandScreen({
  kicker,
  title,
  children,
  adaptiveDensity = false,
  bottomSafeArea = false,
}: BrandScreenProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();
  const [compact, setCompact] = useState<boolean>(true);
  const scrollViewRef: RefObject<GetRef<typeof ScrollView> | null> =
    useRef<GetRef<typeof ScrollView>>(null);
  const scrolledTitleRef: RefObject<string> = useRef<string>(title);
  const density: Density = adaptiveDensity
    ? compact
      ? 'compact'
      : 'spacious'
    : undefined;
  const measureViewport: ScrollViewProps['onLayout'] = adaptiveDensity
    ? ({ nativeEvent: { layout } }) => {
        if (layout.height > 0) {
          setCompact(layout.height < spaciousMinHeight);
        }
      }
    : undefined;

  useEffect(() => {
    if (scrolledTitleRef.current === title) return;
    scrolledTitleRef.current = title;
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [title]);

  return (
    <Screen>
      <View
        flex={1}
        minH="0"
        pb={adaptiveDensity && bottomSafeArea ? 'safe' : '0'}
      >
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          minH="0"
          mx="-4 md:-10"
          onLayout={measureViewport}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View px="4 md:10" pb="4 md:6">
            <Logo density={density} role="img" aria-label="Cityborn">
              <AssetImage asset="logo" />
            </Logo>
            <Separator density={density} />
            <Headline density={density}>
              {kicker !== undefined && (
                <HeadlineKicker>{kicker}</HeadlineKicker>
              )}
              <HeadlineTitle>{title}</HeadlineTitle>
            </Headline>
            <Actions density={density}>{children}</Actions>
            {!adaptiveDensity && bottomSafeArea && <View pb="safe" />}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

type ActionGroupProps = {
  children: ReactNode;
};

export function ActionGroup({ children }: ActionGroupProps) {
  return <ActionGroupFrame>{children}</ActionGroupFrame>;
}
