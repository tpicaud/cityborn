import { type CountdownOptions, useCountdown } from '@cityborn/client/game';
import { View } from 'react-native';
import Dialog from '@/components/ui/Dialog';
import { Text } from '@/components/ui/native/NativeComponents';

export default function RoundCountdown(countdownOptions: CountdownOptions) {
  const count: number = useCountdown(countdownOptions);

  return (
    <View>
      <Dialog visible={true} className="h-full w-full bg-transparent">
        <Text className="text-8xl text-background">{count}</Text>
      </Dialog>
    </View>
  );
}
