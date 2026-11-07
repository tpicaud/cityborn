'use client';

import { LoadingScreen } from '@cityborn/design-system';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpRedirect() {
  const router: AppRouterInstance = useRouter();

  useEffect(() => {
    router.replace('/profile/sign-up');
  }, [router]);

  return <LoadingScreen />;
}
