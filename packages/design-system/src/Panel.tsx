import { styled, Text, View, type ViewProps } from 'tamagui';

export const Panel = styled(View, {
  gap: '2 md:4',
  p: '2 md:5',
  rounded: '2xl md:9',
  backgroundColor: 'panel-fill',
  borderWidth: '1',
  borderTopColor: 'transparent',
  borderLeftColor: 'panel-edge-faded',
  borderRightColor: 'panel-edge-faded',
  borderBottomColor: 'panel-edge',
  boxShadow: 'card',
  variants: {
    notice: {
      true: { gap: '3', p: '4', w: '100%' },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
});

export const PanelTitle = styled(Text, {
  role: 'heading',
  px: 'px',
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '600',
  color: 'white',
});
