import type { ReactNode } from 'react';
import { ScrollView, styled, Text, View } from 'tamagui';

type ScoreListProps = {
  children: ReactNode;
};

type ScoreRowProps = {
  title: string;
  caption: string;
  score: string;
  unit: string;
};

const ScoreRows = styled(View, {
  gap: '1.5 md:2.5',
});

const ScoreRowFrame = styled(View, {
  flexDirection: 'row',
  items: 'center',
  justify: 'space-between',
  gap: '3',
  p: '2 md:4',
  rounded: 'lg md:6',
  backgroundColor: 'score-row-fill',
});

const ScoreRowLabel = styled(View, {
  flexDirection: 'row',
  shrink: 1,
  gap: '1 md:2.5',
});

const ScoreAccent = styled(View, {
  self: 'stretch',
  w: '1 md:1.5',
  rounded: 'full',
  backgroundColor: 'score-accent',
});

const ScoreLines = styled(View, {
  shrink: 1,
  variants: {
    trailing: {
      true: { items: 'flex-end', shrink: 0 },
    },
  } as const,
});

const ScoreHeadline = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '600',
  color: 'white',
  numberOfLines: 1,
});

const ScoreCaption = styled(Text, {
  fontFamily: 'body',
  fontSize: '2 md:6',
  lineHeight: '2 md:6',
  fontWeight: '400',
  color: 'white',
});

export function ScoreList({ children }: ScoreListProps) {
  return (
    <ScrollView
      maxH="60 md:96"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <ScoreRows>{children}</ScoreRows>
    </ScrollView>
  );
}

export function ScoreRow({ title, caption, score, unit }: ScoreRowProps) {
  return (
    <ScoreRowFrame>
      <ScoreRowLabel>
        <ScoreAccent />
        <ScoreLines>
          <ScoreHeadline>{title}</ScoreHeadline>
          <ScoreCaption>{caption}</ScoreCaption>
        </ScoreLines>
      </ScoreRowLabel>
      <ScoreLines trailing>
        <ScoreHeadline>{score}</ScoreHeadline>
        <ScoreCaption>{unit}</ScoreCaption>
      </ScoreLines>
    </ScoreRowFrame>
  );
}
