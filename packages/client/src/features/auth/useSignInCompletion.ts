'use client';

import type { User } from '@cityborn/api';
import { useCallback, useRef } from 'react';
import { useError } from '../../shared/errorContext';
import { useAuth } from './authContext';

export type SignInFlowOptions = {
  onSignedIn?: () => void;
};

export function useSignInCompletion({
  onSignedIn,
}: SignInFlowOptions): (signInRequest: Promise<User>) => Promise<void> {
  const { setUser } = useAuth();
  const { invokeError } = useError();
  const onSignedInRef = useRef<(() => void) | undefined>(onSignedIn);
  onSignedInRef.current = onSignedIn;

  return useCallback(
    async (signInRequest: Promise<User>): Promise<void> => {
      try {
        const signedInUser: User = await signInRequest;
        setUser(signedInUser);
        onSignedInRef.current?.();
      } catch (error: unknown) {
        invokeError(error);
      }
    },
    [setUser, invokeError],
  );
}
