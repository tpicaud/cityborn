import { type RoundTimer, useRoundTimer } from '@cityborn/client/game';
import { colors } from '@cityborn/design-system';
import { Text, View } from 'react-native';

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
    <View className="relative w-full h-10 bg-neutral-200 rounded-full overflow-hidden border border-foreground">
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${roundTimer.progressPercentage}%`,
          backgroundColor: colors.primary[200],
        }}
      />

      <View
        className={`absolute inset-0 flex items-center justify-center font-semibold text-xl z-10`}
      >
        <Text
          className={`font-bold ${roundTimer.isRunningOut ? 'text-red-500' : 'text-foreground'}`}
        >
          {roundTimer.isTimeUp ? endMessage : roundTimer.formattedTimeLeft}
        </Text>
      </View>
    </View>
  );
}
