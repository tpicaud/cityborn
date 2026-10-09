'use client';

import {
  getFriendlyErrorMessage,
  parseApiError,
  resolveErrorMessage,
  type User,
} from '@cityborn/api';
import { useCallback, useEffect, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import type { AuthApi } from './api/authApi';

export type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; user: User | null }
  | { status: 'failed'; errorMessage: string };

export type CurrentUserBootstrap = {
  currentUserState: CurrentUserState;
  retry: () => void;
};

async function loadCurrentUserState(
  authApi: AuthApi,
): Promise<CurrentUserState> {
  try {
    const currentUser: User | null = await authApi.getCurrentUser();
    return { status: 'ready', user: currentUser };
  } catch (error: unknown) {
    return {
      status: 'failed',
      errorMessage: resolveErrorMessage(
        error,
        getFriendlyErrorMessage(parseApiError(0, error)),
      ),
    };
  }
}

export function useCurrentUserBootstrap(): CurrentUserBootstrap {
  const { authApi }: DomainApis = useDomainApis();
  const [currentUserState, setCurrentUserState] = useState<CurrentUserState>({
    status: 'loading',
  });

  useEffect(() => {
    let isActive: boolean = true;

    loadCurrentUserState(authApi).then((loadedState: CurrentUserState) => {
      if (isActive) setCurrentUserState(loadedState);
    });

    return () => {
      isActive = false;
    };
  }, [authApi]);

  const retry = useCallback((): void => {
    setCurrentUserState({ status: 'loading' });
    loadCurrentUserState(authApi).then(setCurrentUserState);
  }, [authApi]);

  return { currentUserState, retry };
}
