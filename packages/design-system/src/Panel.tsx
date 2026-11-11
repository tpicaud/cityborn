import { styled, View, type ViewProps } from 'tamagui';

export const Panel = styled(View, {
  gap: '2',
  p: '2',
  rounded: '2xl',
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
