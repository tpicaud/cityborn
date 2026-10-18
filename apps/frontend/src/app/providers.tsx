'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorReporterProvider } from '@cityborn/client';
import { WsProvider } from '@cityborn/client/ws';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { authApi } from '@/lib/api/auth';
import { contractClient } from '@/lib/api/contractClient';
import { createSocketConnection } from '@/lib/socket';

installFrenchZodErrorMap();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ErrorReporterProvider ErrorDialogComponent={ErrorDialog}>
        <ApiProvider contractClient={contractClient} authApi={authApi}>
          <WsProvider createSocket={createSocketConnection}>
            <AuthBootstrap>{children}</AuthBootstrap>
          </WsProvider>
        </ApiProvider>
      </ErrorReporterProvider>
    </AppRouterCacheProvider>
  );
}
