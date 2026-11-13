import {
  type RoundTimeLeft,
  type RoundTimeLeftOptions,
  useRoundTimeLeft,
} from '@cityborn/client/game';
import { CountdownGauge } from '@cityborn/design-system';

export function RoundTimer(roundTimeLeftOptions: RoundTimeLeftOptions) {
  const { secondsLeft, remainingShare }: RoundTimeLeft =
    useRoundTimeLeft(roundTimeLeftOptions);

  return (
    <CountdownGauge secondsLeft={secondsLeft} remainingShare={remainingShare} />
  );
}
