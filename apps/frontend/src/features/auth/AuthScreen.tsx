'use client';

import { BrandScreen } from '@cityborn/design-system';
import type { ReactNode } from 'react';

type AuthScreenProps = {
  title: string;
  children: ReactNode;
  bottomSafeArea?: boolean;
};

export function AuthScreen({
  title,
  children,
  bottomSafeArea = false,
}: AuthScreenProps) {
  return (
    <BrandScreen title={title} adaptiveDensity bottomSafeArea={bottomSafeArea}>
      {children}
    </BrandScreen>
  );
}
