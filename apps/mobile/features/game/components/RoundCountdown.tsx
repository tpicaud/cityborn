import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Dialog from '@/components/ui/Dialog';
import { Text } from '@/components/ui/native/NativeComponents';

interface RoundCountdownProps {
  onCountdownEnd: () => void;
  initialCount?: number; // Default value 3
}

const RoundCountdown: React.FC<RoundCountdownProps> = ({
  onCountdownEnd,
  initialCount = 3,
}) => {
  const [countdown, setCountdown] = useState(initialCount);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      onCountdownEnd();
    }
  }, [countdown]);

  return (
    <View className="">
      <Dialog visible={true} className="h-full w-full bg-transparent">
        <Text className="text-8xl text-background">{countdown}</Text>
      </Dialog>
    </View>
  );
};

export default RoundCountdown;
