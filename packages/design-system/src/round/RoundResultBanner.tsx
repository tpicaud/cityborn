import type { ReactNode } from 'react';
import { styled, Text, View } from 'tamagui';
import { linearGradient } from '../palette';

const plateSlant: string = '-14deg';

type RoundResultBannerProps = {
  outcome: string;
  placeName: string;
  points: number;
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
  variants: {
    tone: {
      place: { flex: 1, maxW: '60 md:96', pl: '5 md:8', pr: '8 md:12' },
      points: {
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
  skewX: plateSlant,
  variants: {
    tone: {
      place: {
        l: '-8',
        r: '0',
        backgroundImage: linearGradient({
          name: 'dark-blue',
          angleInDegrees: 270,
        }),
        boxShadow: 'result-plate-blue',
      },
      points: {
        l: '0',
        r: '-8',
        backgroundImage: linearGradient({
          name: 'yellow',
          angleInDegrees: 90,
        }),
        boxShadow: 'result-plate-yellow',
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
      place: {
        l: '0',
        r: '2 md:3',
        bg: 'result-plate-shade',
        borderColor: 'result-plate-rim',
      },
      points: {
        l: '2 md:3',
        r: '0',
        bg: 'result-points-shade',
        borderColor: 'result-points-rim',
      },
    },
  } as const,
});

const Outcome = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:7',
  lineHeight: '4 md:7',
  fontWeight: '600',
  color: 'result-caption',
});

const PlaceName = styled(Text, {
  role: 'heading',
  fontFamily: 'body',
  fontSize: '8 md:11',
  lineHeight: '8 md:11',
  fontWeight: '600',
  color: 'secondary-cyan',
});

const PointsLine = styled(View, {
  flexDirection: 'row',
  items: 'baseline',
  gap: '1',
});

const Points = styled(Text, {
  fontFamily: 'body',
  fontSize: '11 md:12',
  lineHeight: '11 md:12',
  fontWeight: '700',
  color: 'white',
  textShadow: 'result-points',
});

const PointsUnit = styled(Text, {
  fontFamily: 'body',
  fontSize: '6 md:9',
  lineHeight: '6 md:9',
  fontWeight: '600',
  color: 'result-unit',
  textShadow: 'result-points',
});

type ResultPlateProps = {
  tone: 'place' | 'points';
  children: ReactNode;
};

function ResultPlate({ tone, children }: ResultPlateProps) {
  return (
    <Plate tone={tone}>
      <PlateBackdrop tone={tone}>
        <PlateInset tone={tone} />
      </PlateBackdrop>
      {children}
    </Plate>
  );
}

export function RoundResultBanner({
  outcome,
  placeName,
  points,
}: RoundResultBannerProps) {
  return (
    <BannerRow role="status">
      <ResultPlate tone="place">
        <Outcome>{outcome}</Outcome>
        <PlaceName>{placeName}</PlaceName>
      </ResultPlate>
      <ResultPlate tone="points">
        <PointsLine>
          <Points>{points}</Points>
          <PointsUnit>Pts</PointsUnit>
        </PointsLine>
      </ResultPlate>
    </BannerRow>
  );
}
