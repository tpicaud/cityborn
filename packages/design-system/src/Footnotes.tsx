import { Anchor, styled, Text, View } from 'tamagui';

export const Footnotes = styled(View, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justify: 'space-between',
  gap: '2',
});

export const Footnote = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '400',
  color: 'footnote',
});

export const FootnoteLink = styled(Anchor, {
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '400',
  color: 'footnote',
  textDecorationLine: 'none hover:underline',
});
