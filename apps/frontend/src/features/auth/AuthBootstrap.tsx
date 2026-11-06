'use client';

import {
  AuthProvider,
  type CurrentUserLoad,
  useCurrentUserLoad,
} from '@cityborn/client/auth';
import { LoadingScreen } from '@cityborn/design-system';
import type { ReactNode } from 'react';
import Button from '@/components/ui/buttons/Button';

type AuthBootstrapProps = {
  children: ReactNode;
};

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { currentUserState, retry }: CurrentUserLoad = useCurrentUserLoad();

  if (currentUserState.status === 'loading') {
    return <LoadingScreen />;
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

  return <AuthProvider user={currentUserState.user}>{children}</AuthProvider>;
}
