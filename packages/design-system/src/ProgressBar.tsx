import { styled, View } from 'tamagui';
import { verticalGradient } from './palette';

type ProgressBarProps = {
  progress: number;
  size?: 'sm' | 'md';
  label: string;
};

const ProgressTrack = styled(View, {
  self: 'stretch',
  overflow: 'hidden',
  rounded: 'full',
  backgroundColor: 'progress-track',
  variants: {
    size: {
      sm: { h: '1.5' },
      md: { h: '2.5' },
    },
  } as const,
});

const ProgressFill = styled(View, {
  h: '100%',
  rounded: 'full',
  backgroundImage: verticalGradient('green'),
});

export function ProgressBar({
  progress,
  size = 'md',
  label,
}: ProgressBarProps) {
  const clampedProgress: number = Math.min(Math.max(progress, 0), 1);
  const percent: number = Math.round(clampedProgress * 100);

  return (
    <ProgressTrack
      size={size}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <ProgressFill w={`${percent}%`} />
    </ProgressTrack>
  );
}
