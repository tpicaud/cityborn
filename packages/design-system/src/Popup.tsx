import type { ReactNode } from 'react';
import { Dialog, styled, View } from 'tamagui';
import { IconButton } from './IconButton';
import { verticalGradient } from './palette';

type PopupTone = 'blue' | 'night';

type PopupProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  tone?: PopupTone;
  children: ReactNode;
};

const PopupOverlay = styled(Dialog.Overlay, {
  backgroundColor: 'scrim',
});

const PopupFrame = styled(Dialog.Content, {
  w: '90%',
  gap: '3',
  px: '3',
  pt: '5',
  pb: '3',
  elevate: false,
  variants: {
    tone: {
      blue: {
        maxW: '80',
        rounded: '10',
        borderWidth: '0',
        backgroundImage: verticalGradient('dark-blue'),
      },
      night: {
        maxW: '96',
        rounded: '3xl',
        borderWidth: '2',
        borderTopColor: 'transparent',
        borderLeftColor: 'panel-edge-faded',
        borderRightColor: 'panel-edge-faded',
        borderBottomColor: 'panel-edge',
        backgroundImage: verticalGradient('night'),
        boxShadow: 'card',
      },
    },
  } as const,
});

const PopupTitle = styled(Dialog.Title, {
  m: '0',
  px: '12',
  fontFamily: 'body',
  fontSize: '8',
  lineHeight: '8',
  fontWeight: '700',
  color: 'white',
  text: 'center',
  textTransform: 'uppercase',
});

export function Popup({
  open,
  onClose,
  title,
  tone = 'blue',
  children,
}: PopupProps) {
  return (
    <Dialog
      modal
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <PopupOverlay key="overlay" />
        <PopupFrame key="content" tone={tone} aria-describedby={undefined}>
          <PopupTitle>{title}</PopupTitle>
          <View position="absolute" t="3" r="3">
            <IconButton icon="close" label="Fermer" onPress={onClose} />
          </View>
          {children}
        </PopupFrame>
      </Dialog.Portal>
    </Dialog>
  );
}
