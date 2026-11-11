import { Anchor, type AnchorProps, styled, View } from 'tamagui';

export const FooterLinks = styled(View, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justify: 'center',
  gap: '4',
  py: '2',
});

export const FooterLink = styled(Anchor, {
  color: 'black',
  fontFamily: 'body',
  fontSize: '4',
  minH: '11',
  py: '2',
  textDecorationLine: 'underline',
  variants: {
    onDarkBackground: {
      true: { color: 'white' },
    },
  } satisfies Record<string, Record<string, AnchorProps>>,
});
