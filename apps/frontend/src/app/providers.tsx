'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorProvider } from '@cityborn/client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { authApi } from '@/lib/api/auth';
import { contractClient } from '@/lib/api/contractClient';

installFrenchZodErrorMap();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ErrorProvider ErrorDialogComponent={ErrorDialog}>
        <ApiProvider contractClient={contractClient} authApi={authApi}>
          <AuthBootstrap>{children}</AuthBootstrap>
        </ApiProvider>
      </ErrorProvider>
    </AppRouterCacheProvider>
  );
}
