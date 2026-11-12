'use client';

import {
  type RoundTimerOptions,
  type RoundTimer as RoundTimerState,
  useRoundTimer,
} from '@cityborn/client/game';
import { CountdownGauge } from '@cityborn/design-system';

export function RoundTimer(roundTimerOptions: RoundTimerOptions) {
  const { secondsLeft, remainingShare, urgency }: RoundTimerState =
    useRoundTimer(roundTimerOptions);

  return (
    <CountdownGauge
      secondsLeft={secondsLeft}
      remainingShare={remainingShare}
      urgency={urgency}
    />
  );
}
