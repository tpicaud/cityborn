import type { ReactNode } from 'react';
import { styled, View } from 'tamagui';
import { IconButton } from '../IconButton';

const tabletMockupWidth: number = 1024;

const tabletActionWidth: number = 636;

type MapHudScreenProps = {
  map: ReactNode;
  gauge?: ReactNode;
  card?: ReactNode;
  onOpenOptions?: () => void;
  banner?: ReactNode;
  action?: ReactNode;
  overlay?: ReactNode;
};

const HudScreenFrame = styled(View, {
  position: 'relative',
  flex: 1,
  h: '100%',
  overflow: 'hidden',
  bg: 'mid-blue',
});

const Layer = styled(View, {
  position: 'absolute',
  t: '0',
  r: '0',
  b: '0',
  l: '0',
});

const Hud = styled(Layer, {
  pt: 'safe',
  px: 'safe',
  pb: 'safe',
  pointerEvents: 'box-none',
});

const HudColumn = styled(View, {
  flex: 1,
  self: 'center',
  w: '100%',
  maxW: tabletMockupWidth,
  justify: 'space-between',
  pointerEvents: 'box-none',
});

const TopBar = styled(View, {
  flexDirection: 'row',
  justify: 'space-between',
  items: 'flex-start',
  pt: '4 md:7',
  pl: '4 md:8',
  pr: '3 md:9',
  pointerEvents: 'box-none',
});

const TopEnd = styled(View, {
  items: 'flex-end',
  gap: '3 md:4',
  mt: '4 md:7',
  pointerEvents: 'box-none',
});

const BottomBar = styled(View, {
  gap: '3 md:10',
  pb: '2 md:4',
  pointerEvents: 'box-none',
});

const ActionSlot = styled(View, {
  self: 'center',
  w: '100%',
  maxW: tabletActionWidth,
  px: '3.5 md:0',
  pointerEvents: 'auto',
});

export function MapHudScreen({
  map,
  gauge,
  card,
  onOpenOptions,
  banner,
  action,
  overlay,
}: MapHudScreenProps) {
  return (
    <HudScreenFrame>
      <Layer>{map}</Layer>
      <Hud>
        <HudColumn>
          <TopBar>
            <View pointerEvents="none">{gauge}</View>
            <TopEnd>
              {onOpenOptions && (
                <View pointerEvents="auto">
                  <IconButton
                    icon="options"
                    label="Options"
                    onPress={onOpenOptions}
                  />
                </View>
              )}
              <View pointerEvents="none">{card}</View>
            </TopEnd>
          </TopBar>
          <BottomBar>
            {banner}
            {action !== undefined && <ActionSlot>{action}</ActionSlot>}
          </BottomBar>
        </HudColumn>
      </Hud>
      {overlay}
    </HudScreenFrame>
  );
}
