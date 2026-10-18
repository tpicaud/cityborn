'use client';

import { type RoundTimer, useRoundTimer } from '@cityborn/client/game';

type TimerProps = {
  totalTimeInSeconds: number;
  endMessage: string;
  onTimeUp: () => void;
};

export default function Timer({
  totalTimeInSeconds,
  endMessage,
  onTimeUp,
}: TimerProps) {
  const roundTimer: RoundTimer = useRoundTimer({
    totalTimeInSeconds,
    onTimeUp,
  });

  return (
    <div className="relative w-full h-10 bg-gray-300 bg-opacity-60 rounded-full overflow-hidden z-50">
      <div
        className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-[0ms]"
        style={{ width: `${roundTimer.progressPercentage}%` }}
      ></div>
      <span
        className={`absolute inset-0 flex items-center justify-center font-semibold text-xl transition-colors duration-500
            ${roundTimer.isRunningOut ? 'text-red-500' : 'text-white'}`}
      >
        {roundTimer.isTimeUp ? endMessage : roundTimer.formattedTimeLeft}
      </span>
    </div>
  );
}
