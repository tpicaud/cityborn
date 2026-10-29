import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { frontendClientConfig } from '@/config/client';

export const metadata: Metadata = {
  title: 'Cityborn — Jouez avec vos amis',
  description:
    'Rejoignez vos amis et trouvez le lieu de naissance des personnalités sur Cityborn.',
  openGraph: {
    title: 'Cityborn — Jouez avec vos amis',
    description:
      'Rejoignez vos amis et trouvez le lieu de naissance des personnalités sur Cityborn.',
    type: 'website',
    siteName: 'Cityborn',
    images: [
      {
        url: new URL(
          '/IconKitchen-Output/web/icon-512.png',
          frontendClientConfig.webAppUrl,
        ).href,
        width: 512,
        height: 512,
        alt: 'Cityborn',
      },
    ],
  },
};

export default function SessionLayout({ children }: { children: ReactNode }) {
  return children;
}
