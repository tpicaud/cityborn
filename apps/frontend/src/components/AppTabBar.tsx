'use client';

import { TabBar, TabBarItem, type TabIcon } from '@cityborn/design-system';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { usePathname, useRouter } from 'next/navigation';

type AppTab = {
  path: '/' | '/collection' | '/social' | '/profile';
  icon: TabIcon;
  label: string;
};

const appTabs: readonly AppTab[] = [
  { path: '/', icon: 'home', label: 'Accueil' },
  { path: '/collection', icon: 'collection', label: 'Collection' },
  { path: '/social', icon: 'social', label: 'Social' },
  { path: '/profile', icon: 'profile', label: 'Profil' },
];

export function AppTabBar() {
  const pathname: string = usePathname();
  const router: AppRouterInstance = useRouter();

  return (
    <TabBar>
      {appTabs.map(({ path, icon, label }: AppTab) => (
        <TabBarItem
          key={path}
          icon={icon}
          label={label}
          active={path === pathname}
          onPress={() => router.push(path)}
        />
      ))}
    </TabBar>
  );
}
