'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ErrorProvider } from '@cityborn/client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';

installFrenchZodErrorMap();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ErrorProvider ErrorDialogComponent={ErrorDialog}>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ErrorProvider>
    </AppRouterCacheProvider>
  );
}
