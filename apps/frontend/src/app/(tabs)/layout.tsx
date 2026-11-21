'use client';

import { TabLayout } from '@cityborn/design-system';
import type { ReactNode } from 'react';
import { AppTabBar } from '@/components/AppTabBar';

type TabsLayoutProps = {
  children: ReactNode;
};

export default function TabsLayout({ children }: TabsLayoutProps) {
  return <TabLayout tabBar={<AppTabBar />}>{children}</TabLayout>;
}
