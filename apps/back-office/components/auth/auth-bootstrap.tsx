'use client';

import {
  AuthProvider,
  type CurrentUserBootstrap,
  useCurrentUserBootstrap,
} from '@cityborn/client/auth';
import type { ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const { currentUserState, retry }: CurrentUserBootstrap =
    useCurrentUserBootstrap(authApi);

  if (currentUserState.status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (currentUserState.status === 'failed') {
    return (
      <div
        role="alert"
        className="h-full flex flex-col items-center justify-center gap-4 text-center"
      >
        <p>{currentUserState.errorMessage}</p>
        <Button variant="primary" onClick={retry}>
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
