import { styled, View, type ViewProps } from 'tamagui';

export const Chevron = styled(View, {
  borderTopWidth: '1.5px md:2.5px',
  borderRightWidth: '1.5px md:2.5px',
  borderColor: 'white',
  rotate: '45deg',
  variants: {
    size: {
      row: {
        w: '1.5 md:3.5',
        h: '1.5 md:3.5',
        mr: '0.5 md:1',
      },
      action: {
        w: '2 md:4',
        h: '2 md:4',
        mr: '1 md:1.5',
        borderTopWidth: '2px md:3px',
        borderRightWidth: '2px md:3px',
      },
    },
  } satisfies Record<string, Record<string, ViewProps>>,
  defaultVariants: {
    size: 'row',
  },
});
