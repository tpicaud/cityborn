import Dialog from '@/components/ui/Dialog';
import { Text } from '@/components/ui/native/NativeComponents';
import { useState, useEffect } from 'react';

interface TimerComponentProps {
  onCountdownEnd: () => void;
  initialCount?: number; // Default value 3
}

const RoundCountdownComponent: React.FC<TimerComponentProps> = ({
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
    <Dialog visible={true} className="bg-transparent">
      <Text className="text-8xl">{countdown}</Text>
    </Dialog>
  );
};

export default RoundCountdownComponent;
