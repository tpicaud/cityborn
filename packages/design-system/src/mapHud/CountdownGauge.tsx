import { styled, Text, View } from 'tamagui';
import { verticalGradient } from '../palette';

type CountdownUrgency = 'calm' | 'warning' | 'critical';

type CountdownGaugeProps = {
  secondsLeft: number;
  remainingShare: number;
  urgency: CountdownUrgency;
};

type Percentage = `${number}%`;

const ringCenterRadiusShare: number = 29.75 / 70;
const ringThicknessShare: number = 10.5 / 70;

function percentage(share: number): Percentage {
  return `${share * 100}%`;
}

const GaugeFrame = styled(View, {
  role: 'timer',
  position: 'relative',
  w: '20 md:32',
  h: '20 md:32',
  rounded: 'full',
  borderWidth: '1',
  borderColor: 'secondary-cyan',
  backgroundImage: verticalGradient('dark-blue'),
});

const Ring = styled(View, {
  position: 'absolute',
  t: '6.25%',
  l: '6.25%',
  w: '87.5%',
  h: '87.5%',
  rounded: 'full',
  bg: 'gauge-track',
});

const HalfClip = styled(View, {
  position: 'absolute',
  t: '0',
  w: '50%',
  h: '100%',
  overflow: 'hidden',
});

const Rotator = styled(View, {
  position: 'absolute',
  t: '0',
  w: '200%',
  h: '100%',
});

const HalfDiskMask = styled(View, {
  position: 'absolute',
  t: '0',
  w: '50%',
  h: '100%',
  overflow: 'hidden',
  variants: {
    side: {
      left: { l: '0' },
      right: { l: '50%' },
    },
  } as const,
});

const Disk = styled(View, {
  position: 'absolute',
  t: '0',
  w: '200%',
  h: '100%',
  rounded: 'full',
  variants: {
    side: {
      left: { l: '0' },
      right: { l: '-100%' },
    },
    urgency: {
      calm: { bg: 'white' },
      warning: { bg: 'cta-orange' },
      critical: { bg: 'common-red' },
    },
  } as const,
});

type HalfDiskProps = {
  side: 'left' | 'right';
  urgency: CountdownUrgency;
};

function HalfDisk({ side, urgency }: HalfDiskProps) {
  return (
    <HalfDiskMask side={side}>
      <Disk side={side} urgency={urgency} />
    </HalfDiskMask>
  );
}

const ArcCap = styled(View, {
  position: 'absolute',
  w: percentage(ringThicknessShare),
  h: percentage(ringThicknessShare),
  rounded: 'full',
  variants: {
    urgency: {
      calm: { bg: 'white' },
      warning: { bg: 'cta-orange' },
      critical: { bg: 'common-red' },
    },
  } as const,
});

const Hub = styled(View, {
  position: 'absolute',
  t: percentage(ringThicknessShare),
  l: percentage(ringThicknessShare),
  r: percentage(ringThicknessShare),
  b: percentage(ringThicknessShare),
  rounded: 'full',
  items: 'center',
  justify: 'center',
  backgroundImage: verticalGradient('dark-blue'),
});

const SecondsLeft = styled(Text, {
  fontFamily: 'body',
  fontSize: '7 md:10',
  lineHeight: '7 md:10',
  fontWeight: '600',
  color: 'white',
  text: 'center',
  select: 'none',
});

function capPosition(angleInDegrees: number): { t: Percentage; l: Percentage } {
  const angleInRadians: number = (angleInDegrees * Math.PI) / 180;
  const capRadiusShare: number = ringThicknessShare / 2;

  return {
    t: percentage(
      0.5 - ringCenterRadiusShare * Math.cos(angleInRadians) - capRadiusShare,
    ),
    l: percentage(
      0.5 + ringCenterRadiusShare * Math.sin(angleInRadians) - capRadiusShare,
    ),
  };
}

export function CountdownGauge({
  secondsLeft,
  remainingShare,
  urgency,
}: CountdownGaugeProps) {
  const arcAngle: number = Math.min(Math.max(remainingShare, 0), 1) * 360;
  const rightAngle: number = Math.min(arcAngle, 180);
  const leftAngle: number = Math.max(arcAngle - 180, 0);

  return (
    <GaugeFrame aria-label={`${secondsLeft} secondes restantes`}>
      <Ring>
        {arcAngle > 0 && (
          <>
            <HalfClip l="50%">
              <Rotator l="-100%" rotate={`${rightAngle}deg`}>
                <HalfDisk side="left" urgency={urgency} />
              </Rotator>
            </HalfClip>
            <HalfClip l="0">
              <Rotator l="0" rotate={`${leftAngle}deg`}>
                <HalfDisk side="right" urgency={urgency} />
              </Rotator>
            </HalfClip>
            <ArcCap urgency={urgency} {...capPosition(0)} />
            <ArcCap urgency={urgency} {...capPosition(arcAngle)} />
          </>
        )}
        <Hub>
          <SecondsLeft>{secondsLeft}</SecondsLeft>
        </Hub>
      </Ring>
    </GaugeFrame>
  );
}
