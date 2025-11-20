import { ReactNode } from 'react';
import { View } from './ui/native/NativeComponents';

export default function ScreenLayout({ children }: { children: ReactNode }) {
  return <View className="flex-1 px-4 py-2">{children}</View>;
}
