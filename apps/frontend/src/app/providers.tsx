'use client';

import { installFrenchZodErrorMap, type User } from '@cityborn/api';
import { ErrorProvider } from '@cityborn/client';
import { AuthProvider } from '@cityborn/client/auth';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import LoadingComponent from '@/components/others/LoadingComponent';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';
import { authApi } from '@/lib/api/auth';

installFrenchZodErrorMap();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] =
    useState<boolean>(true);

  useEffect(() => {
    let isMounted: boolean = true;

    const loadCurrentUser = async (): Promise<void> => {
      const currentUser: User | null = await authApi.getCurrentUser();
      if (!isMounted) return;
      setInitialUser(currentUser);
      setIsLoadingCurrentUser(false);
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      {isLoadingCurrentUser ? (
        <LoadingComponent message="Chargement de l'utilisateur" />
      ) : (
        <AuthProvider
          initialValue={initialUser}
          getCurrentUser={authApi.getCurrentUser}
        >
          <ErrorProvider ErrorDialogComponent={ErrorDialog}>
            {children}
          </ErrorProvider>
        </AuthProvider>
      )}
    </AppRouterCacheProvider>
  );
}
