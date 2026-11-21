import { styled, Text, type TextProps } from 'tamagui';

export const BodyText = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:6',
  lineHeight: '6 md:8',
  color: 'white',
  text: 'center',
  variants: {
    emphasized: {
      true: { fontWeight: '700' },
    },
  } satisfies Record<string, Record<string, TextProps>>,
});
