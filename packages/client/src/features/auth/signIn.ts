'use client';

import {
  type SignIn,
  SignInSchema,
  type SignInWithApple,
  type SignInWithGoogle,
  type User,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';
import { setCurrentUser } from './api/authQueries';
import {
  type SignUpFormInput,
  SignUpFormSchema,
  type SignUpFormValues,
  toCreateUser,
} from './authSchema';

type SignInCompletionOptions = {
  onSignedIn?: () => void;
};

type SignInCompletion = (signInRequest: Promise<User>) => Promise<void>;

export type SignInFlowOptions = SignInCompletionOptions;

export type SignUpFlowOptions = SignInCompletionOptions;

export type IdentityProviderSignInOptions = SignInCompletionOptions;

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

const signInFormDefaultValues: SignIn = { identifier: '', password: '' };

const signUpFormDefaultValues: SignUpFormInput = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function useSignInCompletion({
  onSignedIn,
}: SignInCompletionOptions): SignInCompletion {
  const queryClient: QueryClient = useQueryClient();
  const { invokeError }: ErrorReporter = useErrorReporter();
  const onSignedInRef = useRef<(() => void) | undefined>(onSignedIn);
  onSignedInRef.current = onSignedIn;

  return useCallback(
    async (signInRequest: Promise<User>): Promise<void> => {
      try {
        const signedInUser: User = await signInRequest;
        await setCurrentUser({ queryClient, user: signedInUser });
        onSignedInRef.current?.();
      } catch (error: unknown) {
        invokeError(error);
      }
    },
    [queryClient, invokeError],
  );
}

export function useSignInFlow({
  onSignedIn,
}: SignInFlowOptions = {}): SignInFlow {
  const { authApi }: DomainApis = useDomainApis();
  const completeSignIn: SignInCompletion = useSignInCompletion({ onSignedIn });
  const form: UseFormReturn<SignIn> = useForm<SignIn>({
    resolver: zodResolver(SignInSchema),
    defaultValues: signInFormDefaultValues,
  });

  return {
    form,
    submit: form.handleSubmit((values) =>
      completeSignIn(authApi.signIn(values)),
    ),
  };
}

export function useSignUpFlow({
  onSignedIn,
}: SignUpFlowOptions = {}): SignUpFlow {
  const { authApi }: DomainApis = useDomainApis();
  const completeSignIn: SignInCompletion = useSignInCompletion({ onSignedIn });
  const form: UseFormReturn<SignUpFormInput, undefined, SignUpFormValues> =
    useForm<SignUpFormInput, undefined, SignUpFormValues>({
      resolver: zodResolver(SignUpFormSchema),
      defaultValues: signUpFormDefaultValues,
    });

  return {
    form,
    submit: form.handleSubmit((values) =>
      completeSignIn(authApi.signUp(toCreateUser(values))),
    ),
  };
}

export function useIdentityProviderSignIn({
  onSignedIn,
}: IdentityProviderSignInOptions = {}): IdentityProviderSignIn {
  const { authApi }: DomainApis = useDomainApis();
  const completeSignIn: SignInCompletion = useSignInCompletion({ onSignedIn });

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
