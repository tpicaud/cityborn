import type { ReactNode } from 'react';
import { styled, Text, View } from 'tamagui';
import { IconButton } from '../IconButton';
import { ScreenFrame } from './ScreenFrame';

const tabletMockupWidth: number = 1024;

type ScreenProps = {
  title?: string;
  onBack?: () => void;
  bottomSafeArea?: boolean;
  children: ReactNode;
};

const ScreenSafeArea = styled(View, {
  flex: 1,
  pt: 'safe',
  px: 'safe',
  variants: {
    bottomSafeArea: {
      true: { pb: 'safe' },
    },
  } as const,
});

const ScreenColumn = styled(View, {
  flex: 1,
  self: 'center',
  w: '100%',
  maxW: tabletMockupWidth,
  gap: '4',
  px: '4 md:10',
  pt: '4 md:6',
});

const BackSlot = styled(View, {
  self: 'flex-start',
  h: '10 md:12',
  ml: '-2',
});

const ScreenTitle = styled(Text, {
  role: 'heading',
  fontFamily: 'heading',
  fontSize: '13 md:14',
  lineHeight: '13 md:14',
  fontWeight: '700',
  color: 'white',
  textShadow: 'screen-title',
});

export function Screen({
  title,
  onBack,
  bottomSafeArea = false,
  children,
}: ScreenProps) {
  const hasHeader: boolean = title !== undefined || onBack !== undefined;

  return (
    <ScreenFrame>
      <ScreenSafeArea bottomSafeArea={bottomSafeArea}>
        <ScreenColumn>
          {hasHeader && (
            <View>
              {onBack && (
                <BackSlot>
                  <IconButton icon="back" label="Retour" onPress={onBack} />
                </BackSlot>
              )}
              {title !== undefined && <ScreenTitle>{title}</ScreenTitle>}
            </View>
          )}
          <View flex={1} minH="0">
            {children}
          </View>
        </ScreenColumn>
      </ScreenSafeArea>
    </ScreenFrame>
  );
}
