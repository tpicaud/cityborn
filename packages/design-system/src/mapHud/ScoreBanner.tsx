import type { ReactNode } from 'react';
import { styled, Text, View } from 'tamagui';
import { linearGradient } from '../palette';

const plateSlant: string = '-14deg';

type ScoreBannerProps = {
  caption: string;
  title: string;
  score: number;
};

const BannerRow = styled(View, {
  flexDirection: 'row',
  items: 'stretch',
  gap: '2',
});

const Plate = styled(View, {
  position: 'relative',
  justify: 'center',
  minH: '20 md:32',
  py: '2 md:3',
  variants: {
    tone: {
      title: { flex: 1, maxW: '60 md:96', pl: '5 md:8', pr: '8 md:12' },
      score: {
        ml: 'auto',
        w: '44 md:72',
        items: 'center',
        pl: '6 md:10',
        pr: '3 md:6',
      },
    },
  } as const,
});

const PlateBackdrop = styled(View, {
  position: 'absolute',
  t: '0',
  b: '0',
  rounded: '6 md:9',
  variants: {
    tone: {
      title: {
        l: '-8',
        r: '0',
        backgroundImage: linearGradient({
          name: 'dark-blue',
          angleInDegrees: 270,
        }),
        boxShadow: 'banner-plate-blue',
      },
      score: {
        l: '0',
        r: '-8',
        backgroundImage: linearGradient({
          name: 'yellow',
          angleInDegrees: 90,
        }),
        boxShadow: 'banner-plate-yellow',
      },
    },
  } as const,
});

const PlateInset = styled(View, {
  position: 'absolute',
  t: '1.5 md:2',
  b: '1.5 md:2',
  rounded: '4 md:7',
  borderWidth: '2 md:4',
  variants: {
    tone: {
      title: {
        l: '0',
        r: '2 md:3',
        bg: 'banner-title-shade',
        borderColor: 'banner-title-rim',
      },
      score: {
        l: '2 md:3',
        r: '0',
        bg: 'banner-score-shade',
        borderColor: 'banner-score-rim',
      },
    },
  } as const,
});

const PlateContent = styled(View, {
  position: 'relative',
});

const Caption = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:7',
  lineHeight: '4 md:7',
  fontWeight: '600',
  color: 'banner-caption',
});

type TitleSize = 'large' | 'medium' | 'small' | 'smallest';

const titleSizeMaxLengths: [TitleSize, number][] = [
  ['large', 10],
  ['medium', 12],
  ['small', 14],
];

function titleSize(title: string): TitleSize {
  const fittingSize: [TitleSize, number] | undefined = titleSizeMaxLengths.find(
    ([, maxLength]: [TitleSize, number]) => title.length <= maxLength,
  );
  return fittingSize?.[0] ?? 'smallest';
}

const Title = styled(Text, {
  role: 'heading',
  fontFamily: 'body',
  fontWeight: '600',
  color: 'secondary-cyan',
  variants: {
    size: {
      large: { fontSize: '8 md:11', lineHeight: '10 md:12' },
      medium: { fontSize: '7 md:9', lineHeight: '9 md:10' },
      small: { fontSize: '6 md:8', lineHeight: '7 md:10' },
      smallest: { fontSize: '5 md:7', lineHeight: '6 md:9' },
    },
  } as const,
});

const ScoreLine = styled(View, {
  flexDirection: 'row',
  items: 'baseline',
  gap: '1',
});

const Score = styled(Text, {
  fontFamily: 'body',
  fontSize: '11 md:12',
  lineHeight: '11 md:12',
  fontWeight: '700',
  color: 'white',
  textShadow: 'banner-score',
});

const ScoreUnit = styled(Text, {
  fontFamily: 'body',
  fontSize: '6 md:9',
  lineHeight: '6 md:9',
  fontWeight: '600',
  color: 'banner-unit',
  textShadow: 'banner-score',
});

type BannerPlateProps = {
  tone: 'title' | 'score';
  children: ReactNode;
};

function BannerPlate({ tone, children }: BannerPlateProps) {
  return (
    <Plate tone={tone}>
      <PlateBackdrop tone={tone} skewX={plateSlant}>
        <PlateInset tone={tone} />
      </PlateBackdrop>
      <PlateContent>{children}</PlateContent>
    </Plate>
  );
}

export function ScoreBanner({ caption, title, score }: ScoreBannerProps) {
  return (
    <BannerRow role="status">
      <BannerPlate tone="title">
        <Caption>{caption}</Caption>
        <Title size={titleSize(title)}>{title}</Title>
      </BannerPlate>
      <BannerPlate tone="score">
        <ScoreLine>
          <Score>{score}</Score>
          <ScoreUnit>Pts</ScoreUnit>
        </ScoreLine>
      </BannerPlate>
    </BannerRow>
  );
}
