'use client';

import {
  type Countdown,
  type CountdownOptions,
  useCountdown,
} from '@cityborn/client/game';
import { CountdownOverlay } from '@cityborn/design-system';

export function RoundStartCountdown(countdownOptions: CountdownOptions) {
  const { count }: Countdown = useCountdown(countdownOptions);

  return <CountdownOverlay count={count} />;
}
