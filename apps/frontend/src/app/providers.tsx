'use client';

import { installFrenchZodErrorMap, type User } from '@cityborn/api';
import { ErrorProvider } from '@cityborn/client';
import { AuthProvider } from '@cityborn/client/auth';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import { getCurrentUser } from '@/server/use-server/auth';

installFrenchZodErrorMap();

export function AppProviders({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <AuthProvider initialValue={user} getCurrentUser={getCurrentUser}>
        <ErrorProvider ErrorDialogComponent={ErrorDialog}>
          {children}
        </ErrorProvider>
      </AuthProvider>
    </AppRouterCacheProvider>
  );
}
