'use client';

import type { SignInWithApple, SignInWithGoogle } from '@cityborn/api';
import { useMemo } from 'react';
import { type DomainApis, useDomainApis } from '../../../shared/apiProvider';
import {
  type SignInFlowOptions,
  useSignInCompletion,
} from './useSignInCompletion';

export type IdentityProviderSignIn = {
  signInWithGoogle: (data: SignInWithGoogle) => Promise<void>;
  signInWithApple: (data: SignInWithApple) => Promise<void>;
};

export function useIdentityProviderSignIn({
  onSignedIn,
}: SignInFlowOptions = {}): IdentityProviderSignIn {
  const { authApi }: DomainApis = useDomainApis();
  const completeSignIn = useSignInCompletion({ onSignedIn });

  return useMemo(
    () => ({
      signInWithGoogle: (data: SignInWithGoogle) =>
        completeSignIn(authApi.signInWithGoogle(data)),
      signInWithApple: (data: SignInWithApple) =>
        completeSignIn(authApi.signInWithApple(data)),
    }),
    [authApi, completeSignIn],
  );
}
