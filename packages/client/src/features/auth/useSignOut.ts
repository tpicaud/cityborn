'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import { clearCacheAfterSignOut } from './api/authQueries';

type SignOutOptions = {
  onSignedOut?: () => void;
};

export type SignOut = () => Promise<void>;

export function useSignOut({ onSignedOut }: SignOutOptions = {}): SignOut {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { invokeError } = useError();
  const onSignedOutRef = useRef<(() => void) | undefined>(onSignedOut);
  onSignedOutRef.current = onSignedOut;

  return useCallback(async (): Promise<void> => {
    try {
      await authApi.signOut();
      await clearCacheAfterSignOut(queryClient);
      onSignedOutRef.current?.();
    } catch (error: unknown) {
      invokeError(error);
    }
  }, [authApi, queryClient, invokeError]);
}
