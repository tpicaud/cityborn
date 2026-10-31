import type { ReactNode } from 'react';
import { View } from './native/NativeComponents';

type LegacyCardProps = {
  children: ReactNode;
};

export function LegacyCard({ children }: LegacyCardProps) {
  return (
    <View className="flex-1 mb-4 overflow-hidden rounded-2xl bg-background px-4 py-2">
      {children}
    </View>
  );
}
