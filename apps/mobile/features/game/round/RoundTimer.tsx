import {
  type RoundTimerOptions,
  type RoundTimer as RoundTimerState,
  useRoundTimer,
} from '@cityborn/client/game';
import { RoundTimerGauge } from '@cityborn/design-system';

export function RoundTimer(roundTimerOptions: RoundTimerOptions) {
  const { secondsLeft, remainingShare, urgency }: RoundTimerState =
    useRoundTimer(roundTimerOptions);

  return (
    <RoundTimerGauge
      secondsLeft={secondsLeft}
      remainingShare={remainingShare}
      urgency={urgency}
    />
  );
}
