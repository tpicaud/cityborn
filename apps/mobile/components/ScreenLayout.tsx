import View from '@/components/ui/View';
import { ReactNode } from 'react';

export default function ScreenLayout({ children }: { children: ReactNode }) {
  return <View className="flex-1 px-4 py-2">{children}</View>;
}
