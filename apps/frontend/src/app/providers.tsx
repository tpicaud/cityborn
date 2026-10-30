'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorReporterProvider } from '@cityborn/client';
import { WsProvider } from '@cityborn/client/ws';
import { CommonIconsProvider, tamaguiConfig } from '@cityborn/design-system';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import { CommonIconImage } from '@/components/CommonIconImage';
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
      <CommonIconsProvider image={CommonIconImage}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <ErrorReporterProvider ErrorDialogComponent={ErrorDialog}>
            <ApiProvider contractClient={contractClient} authApi={authApi}>
              <WsProvider createSocket={createSocketConnection}>
                <AuthBootstrap>{children}</AuthBootstrap>
              </WsProvider>
            </ApiProvider>
          </ErrorReporterProvider>
        </TamaguiProvider>
      </CommonIconsProvider>
    </AppRouterCacheProvider>
  );
}
