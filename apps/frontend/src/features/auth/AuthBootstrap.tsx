'use client';

import { resolveErrorMessage, type User } from '@cityborn/api';
import { AuthProvider } from '@cityborn/client/auth';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import LoadingComponent from '@/components/others/LoadingComponent';
import Button from '@/components/ui/buttons/Button';
import { authApi } from '@/lib/api/auth';

type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; user: User | null }
  | { status: 'failed'; errorMessage: string };

type AuthBootstrapProps = {
  children: ReactNode;
};

type CurrentUserBootstrapProps = AuthBootstrapProps & {
  onRetry: () => void;
};

function CurrentUserBootstrap({
  children,
  onRetry,
}: CurrentUserBootstrapProps) {
  const [currentUserState, setCurrentUserState] = useState<CurrentUserState>({
    status: 'loading',
  });

  useEffect(() => {
    let isActive: boolean = true;

    const loadCurrentUser = async (): Promise<void> => {
      try {
        const currentUser: User | null = await authApi.getCurrentUser();
        if (!isActive) return;
        setCurrentUserState({ status: 'ready', user: currentUser });
      } catch (error: unknown) {
        if (!isActive) return;
        setCurrentUserState({
          status: 'failed',
          errorMessage: resolveErrorMessage(error),
        });
      }
    };

    loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, []);

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
        <Button variant="contained" onClick={onRetry}>
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

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [loadAttempt, setLoadAttempt] = useState<number>(0);

  return (
    <CurrentUserBootstrap
      key={loadAttempt}
      onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
    >
      {children}
    </CurrentUserBootstrap>
  );
}
