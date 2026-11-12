import {
  type Countdown,
  type CountdownOptions,
  useCountdown,
} from '@cityborn/client/game';
import { RoundCountdown } from '@cityborn/design-system';

export function RoundStartCountdown(countdownOptions: CountdownOptions) {
  const { count }: Countdown = useCountdown(countdownOptions);

  return <RoundCountdown count={count} />;
}
