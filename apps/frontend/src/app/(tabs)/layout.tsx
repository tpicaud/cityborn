'use client';

import type { ReactNode } from 'react';
import { View } from 'tamagui';
import { AppTabBar } from '@/components/AppTabBar';

type TabsLayoutProps = {
  children: ReactNode;
};

export default function TabsLayout({ children }: TabsLayoutProps) {
  return (
    <View h="100%">
      <View flex={1}>{children}</View>
      <AppTabBar />
    </View>
  );
}
