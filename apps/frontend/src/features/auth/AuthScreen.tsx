'use client';

import { BrandScreen } from '@cityborn/design-system';
import type { ReactNode } from 'react';

type AuthScreenProps = {
  title: string;
  children: ReactNode;
  bottomSafeArea?: boolean;
  onBack?: () => void;
};

export function AuthScreen({
  title,
  children,
  bottomSafeArea = false,
  onBack,
}: AuthScreenProps) {
  return (
    <BrandScreen
      title={title}
      form
      bottomSafeArea={bottomSafeArea}
      onBack={onBack}
    >
      {children}
    </BrandScreen>
  );
}
