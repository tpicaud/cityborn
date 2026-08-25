'use client';

import type { User } from '@cityborn/api';
import { ErrorProvider } from '@cityborn/client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import AuthProvider from '@/contexts/AuthContext';

export function AppProviders({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <AuthProvider initialValue={user}>
        <ErrorProvider ErrorDialogComponent={ErrorDialog}>
          {children}
        </ErrorProvider>
      </AuthProvider>
    </AppRouterCacheProvider>
  );
}
