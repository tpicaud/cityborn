import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { View } from './ui/native/NativeComponents';

export default function ScreenLayout({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <View className={cn('flex-1 bg-background', !fullBleed && 'px-4 py-2')}>
      {children}
    </View>
  );
}
