import { colors } from '@cityborn/design-system';
import type React from 'react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface TimerProps {
  totalTime: number;
  endMessage: string;
  setTimerEnded: Dispatch<SetStateAction<boolean>>;
}

const Timer: React.FC<TimerProps> = ({
  totalTime,
  endMessage,
  setTimerEnded,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [progress, setProgress] = useState((timeLeft / totalTime) * 100);

  useEffect(() => {
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newTimeLeft = Math.max(totalTime - elapsed, 0);

      setTimeLeft(newTimeLeft);
      setProgress((newTimeLeft / totalTime) * 100);

      if (newTimeLeft <= 0) {
        setTimerEnded(true);
        clearInterval(intervalId);
      }
    }, 7);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <View className="relative w-full h-10 bg-neutral-200 rounded-full overflow-hidden border border-foreground">
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          backgroundColor: colors.primary[200],
        }}
      />

      {/* Texte */}
      <View
        className={`absolute inset-0 flex items-center justify-center font-semibold text-xl z-10`}
      >
        <Text
          className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-foreground'}`}
        >
          {timeLeft > 0 ? formatTime(timeLeft + 1) : endMessage}
        </Text>
      </View>
    </View>
  );
};

export default Timer;
