'use client';

import {
  AuthProvider,
  type CurrentUserBootstrap,
  useCurrentUserBootstrap,
} from '@cityborn/client/auth';
import type { ReactNode } from 'react';
import Button from '@/components/ui/buttons/Button';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { authApi } from '@/lib/api/auth';

type AuthBootstrapProps = {
  children: ReactNode;
};

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { currentUserState, retry }: CurrentUserBootstrap =
    useCurrentUserBootstrap(authApi);

  if (currentUserState.status === 'loading') {
    return <LoadingComponent message="Chargement de l'utilisateur" />;
  }

  if (currentUserState.status === 'failed') {
    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <p>{currentUserState.errorMessage}</p>
        <Button variant="contained" onClick={retry}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <AuthProvider
      initialValue={currentUserState.user}
      getCurrentUser={authApi.getCurrentUser}
    >
      {children}
    </AuthProvider>
  );
}
