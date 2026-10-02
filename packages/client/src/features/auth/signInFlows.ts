'use client';

import type {
  ApiResult,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  User,
} from '@cityborn/api';
import { type BaseSyntheticEvent, useCallback, useMemo, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useError } from '../../shared/errorContext';
import type { AuthApi } from './authApi';
import { useAuth } from './authContext';
import { useSignInForm, useSignUpForm } from './authForms';
import {
  type SignUpFormInput,
  type SignUpFormValues,
  toCreateUser,
} from './authSchema';

export type SignInFlowOptions = {
  authApi: AuthApi;
  onSignedIn?: () => void;
};

type FormSubmitHandler = (event?: BaseSyntheticEvent) => Promise<void>;

export type SignInFlow = {
  form: UseFormReturn<SignIn>;
  submit: FormSubmitHandler;
};

export type SignUpFlow = {
  form: UseFormReturn<SignUpFormInput, undefined, SignUpFormValues>;
  submit: FormSubmitHandler;
};

export type IdentityProviderSignIn = {
  signInWithGoogle: (data: SignInWithGoogle) => Promise<void>;
  signInWithApple: (data: SignInWithApple) => Promise<void>;
};

function useSignInCompletion({
  onSignedIn,
}: Pick<SignInFlowOptions, 'onSignedIn'>): (
  signInRequest: Promise<ApiResult<User>>,
) => Promise<void> {
  const { setUser } = useAuth();
  const { invokeError } = useError();
  const onSignedInRef = useRef<(() => void) | undefined>(onSignedIn);
  onSignedInRef.current = onSignedIn;

  return useCallback(
    async (signInRequest: Promise<ApiResult<User>>): Promise<void> => {
      try {
        const result: ApiResult<User> = await signInRequest;
        if (!result.ok) return invokeError(result.error);
        setUser(result.data);
        onSignedInRef.current?.();
      } catch (error: unknown) {
        invokeError(error);
      }
    },
    [setUser, invokeError],
  );
}

export function useSignIn({
  authApi,
  onSignedIn,
}: SignInFlowOptions): SignInFlow {
  const completeSignIn = useSignInCompletion({ onSignedIn });
  const form: UseFormReturn<SignIn> = useSignInForm();

  return {
    form,
    submit: form.handleSubmit((values) =>
      completeSignIn(authApi.signIn(values)),
    ),
  };
}

export function useSignUp({
  authApi,
  onSignedIn,
}: SignInFlowOptions): SignUpFlow {
  const completeSignIn = useSignInCompletion({ onSignedIn });
  const form: UseFormReturn<SignUpFormInput, undefined, SignUpFormValues> =
    useSignUpForm();

  return {
    form,
    submit: form.handleSubmit((values) =>
      completeSignIn(authApi.signUp(toCreateUser(values))),
    ),
  };
}

export function useIdentityProviderSignIn({
  authApi,
  onSignedIn,
}: SignInFlowOptions): IdentityProviderSignIn {
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
