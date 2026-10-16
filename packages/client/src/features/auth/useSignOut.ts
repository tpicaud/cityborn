'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import { clearCacheAfterSignOut } from './api/authQueries';

export type SignOutOptions = {
  onSignedOut?: () => void;
};

export type SignOut = {
  signOut: () => Promise<void>;
};

export function useSignOut({ onSignedOut }: SignOutOptions = {}): SignOut {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const onSignedOutRef = useRef<(() => void) | undefined>(onSignedOut);
  onSignedOutRef.current = onSignedOut;

  const signOut: () => Promise<void> = useCallback(async (): Promise<void> => {
    try {
      await authApi.signOut();
      await clearCacheAfterSignOut(queryClient);
      onSignedOutRef.current?.();
    } catch (error: unknown) {
      reportError(error);
    }
  }, [authApi, queryClient, reportError]);

  return { signOut };
}
