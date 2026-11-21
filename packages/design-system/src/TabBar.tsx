import { type ComponentType, type ReactNode, useState } from 'react';
import { styled, View } from 'tamagui';
import {
  type AssetImageProps,
  type ImageAsset,
  type TabIcon,
  useAssetImage,
} from './assetImage';
import { Caption } from './Caption';
import { PressableFrame } from './PressableFrame';

type GlyphSize = {
  width: number;
  height: number;
};

type TabGlyphSizes = {
  idle: GlyphSize;
  pressed: GlyphSize;
};

type SlotShare = `${number}%`;

const figmaIconSlotSize: number = 52;

const tabGlyphSizes: Record<TabIcon, TabGlyphSizes> = {
  home: {
    idle: { width: 34, height: 34 },
    pressed: { width: 30, height: 30 },
  },
  collection: {
    idle: { width: 40, height: 30 },
    pressed: { width: 36, height: 27 },
  },
  social: {
    idle: { width: 40, height: 28 },
    pressed: { width: 34, height: 24 },
  },
  profile: {
    idle: { width: 24, height: 30 },
    pressed: { width: 20, height: 25 },
  },
};

function slotShare(length: number): SlotShare {
  return `${(length / figmaIconSlotSize) * 100}%`;
}

const TabBarFrame = styled(View, {
  pb: 'safe',
  backgroundColor: 'dark-blue',
  boxShadow: 'nav-bar',
});

const TabBarRow = styled(View, {
  role: 'tablist',
  flexDirection: 'row',
  justify: 'center',
  items: 'flex-start',
  pt: '2 md:3',
  pb: '2 md:3',
});

const TabBarItemFrame = styled(PressableFrame, {
  role: 'tab',
  items: 'center',
  gap: '1 md:1.5',
  w: '20 md:32',
  p: '0',
  backgroundColor: 'transparent',
});

const TabIconSlot = styled(View, {
  items: 'center',
  justify: 'center',
  w: '14 md:20',
  h: '14 md:20',
  rounded: '6 md:9',
  borderWidth: '2',
  variants: {
    active: {
      true: {
        backgroundColor: 'tab-highlight-fill',
        borderColor: 'tab-highlight-border',
      },
      false: {
        borderColor: 'transparent',
      },
    },
  } as const,
});

const TabLabel = styled(Caption, {
  fontSize: '2 md:5',
  lineHeight: '2 md:5',
  color: 'secondary-cyan',
  text: 'center',
  select: 'none',
});

type TabBarProps = {
  children: ReactNode;
};

export function TabBar({ children }: TabBarProps) {
  return (
    <TabBarFrame>
      <TabBarRow>{children}</TabBarRow>
    </TabBarFrame>
  );
}

type TabBarItemProps = {
  icon: TabIcon;
  label: string;
  active: boolean;
  onPress: () => void;
};

export function TabBarItem({ icon, label, active, onPress }: TabBarItemProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();
  const [pressed, setPressed] = useState<boolean>(false);
  const { width, height }: GlyphSize = pressed
    ? tabGlyphSizes[icon].pressed
    : tabGlyphSizes[icon].idle;
  const asset: ImageAsset = pressed
    ? `navigation/${icon}-pressed`
    : `navigation/${icon}`;

  return (
    <TabBarItemFrame
      aria-label={label}
      aria-selected={active}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <TabIconSlot active={active}>
        <View w={slotShare(width)} h={slotShare(height)}>
          <AssetImage asset={asset} />
        </View>
      </TabIconSlot>
      {active && <TabLabel aria-hidden>{label}</TabLabel>}
    </TabBarItemFrame>
  );
}

type TabLayoutProps = {
  tabBar: ReactNode;
  children: ReactNode;
};

export function TabLayout({ tabBar, children }: TabLayoutProps) {
  return (
    <View h="100%">
      <View flex={1}>{children}</View>
      {tabBar}
    </View>
  );
}
