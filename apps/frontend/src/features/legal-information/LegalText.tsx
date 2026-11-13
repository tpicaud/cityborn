import type { ReactNode } from 'react';
import { Anchor, styled, Text, View } from 'tamagui';

export const LegalDocument = styled(View, {
  render: 'article',
  gap: '4 md:5',
  minW: '0',
});

export const LegalDocumentTitle = styled(Text, {
  render: 'h2',
  m: '0',
  fontFamily: 'heading',
  fontSize: '8 md:10',
  lineHeight: '8 md:10',
  fontWeight: '700',
  color: 'white',
});

export const LegalDocumentVersion = styled(Text, {
  render: 'p',
  m: '0',
  fontFamily: 'body',
  fontSize: '3 md:5',
  lineHeight: '4 md:6',
  fontWeight: '400',
  color: 'footnote',
});

export const LegalHeading = styled(Text, {
  render: 'h3',
  m: '0',
  pt: '4',
  fontFamily: 'body',
  fontSize: '5 md:7',
  lineHeight: '6 md:8',
  fontWeight: '600',
  color: 'white',
});

export const LegalSubheading = styled(Text, {
  render: 'h4',
  m: '0',
  pt: '2',
  fontFamily: 'body',
  fontSize: '4 md:6',
  lineHeight: '5 md:7',
  fontWeight: '600',
  color: 'white',
});

export const LegalParagraph = styled(Text, {
  render: 'p',
  m: '0',
  fontFamily: 'body',
  fontSize: '4 md:5',
  lineHeight: '6 md:7',
  fontWeight: '400',
  color: 'white',
});

export const LegalLink = styled(Anchor, {
  color: 'white',
  textDecorationLine: 'underline',
  wordBreak: 'break-word',
});

export const LegalList = styled(View, {
  render: 'ul',
  m: '0',
  p: '0',
  pl: '2',
  gap: '2',
});

export function LegalListItem({ children }: { children: ReactNode }) {
  return (
    <View render="li" flexDirection="row" gap="2">
      <LegalParagraph render="span" aria-hidden>
        •
      </LegalParagraph>
      <LegalParagraph render="span" shrink={1}>
        {children}
      </LegalParagraph>
    </View>
  );
}

const LegalFactsFrame = styled(View, {
  gap: '2',
  p: '3 md:4',
  rounded: 'lg md:6',
  backgroundColor: 'row-fill',
});

const LegalFactList = styled(View, {
  render: 'dl',
  m: '0',
  gap: '2',
});

const LegalFactsTitle = styled(LegalParagraph, {
  fontWeight: '600',
});

const LegalFactTerm = styled(LegalParagraph, {
  render: 'dt',
  fontWeight: '600',
});

const LegalFactValue = styled(LegalParagraph, {
  render: 'dd',
  m: '0',
});

type LegalFactsProps = {
  title?: string;
  children: ReactNode;
};

export function LegalFacts({ title, children }: LegalFactsProps) {
  return (
    <LegalFactsFrame>
      {title !== undefined && <LegalFactsTitle>{title}</LegalFactsTitle>}
      <LegalFactList>{children}</LegalFactList>
    </LegalFactsFrame>
  );
}

type LegalFactProps = {
  term: string;
  children: ReactNode;
};

export function LegalFact({ term, children }: LegalFactProps) {
  return (
    <View>
      <LegalFactTerm>{term}</LegalFactTerm>
      <LegalFactValue>{children}</LegalFactValue>
    </View>
  );
}
