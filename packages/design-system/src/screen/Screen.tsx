import type { ReactNode } from 'react';
import { styled, Text, View } from 'tamagui';
import { IconButton } from '../IconButton';
import { ScreenFrame } from './ScreenFrame';

const tabletMockupWidth: number = 1024;

type ScreenProps = {
  title?: string;
  onBack?: () => void;
  children: ReactNode;
};

const ScreenSafeArea = styled(View, {
  flex: 1,
  pt: 'safe',
  px: 'safe',
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
  fontSize: '10 md:11',
  lineHeight: '10 md:11',
  fontWeight: '700',
  color: 'white',
  textShadow: 'screen-title',
});

export function Screen({ title, onBack, children }: ScreenProps) {
  const hasHeader: boolean = title !== undefined || onBack !== undefined;

  return (
    <ScreenFrame>
      <ScreenSafeArea>
        <ScreenColumn>
          {hasHeader && (
            <View>
              <BackSlot>
                {onBack && (
                  <IconButton icon="back" label="Retour" onPress={onBack} />
                )}
              </BackSlot>
              {title !== undefined && <ScreenTitle>{title}</ScreenTitle>}
            </View>
          )}
          <View flex={1}>{children}</View>
        </ScreenColumn>
      </ScreenSafeArea>
    </ScreenFrame>
  );
}
