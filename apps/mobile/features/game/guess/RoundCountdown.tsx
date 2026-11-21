import { View } from 'react-native';
import Dialog from '@/components/ui/Dialog';
import { Text } from '@/components/ui/native/NativeComponents';

export default function RoundCountdown({ count }: { count: number }) {
  return (
    <View>
      <Dialog visible={true} className="h-full w-full bg-transparent">
        <Text className="text-8xl text-background">{count}</Text>
      </Dialog>
    </View>
  );
}
