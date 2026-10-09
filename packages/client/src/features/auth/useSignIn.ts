'use client';

import type { SignIn } from '@cityborn/api';
import type { UseFormReturn } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { type FormSubmitHandler, useSignInForm } from './authForms';
import {
  type SignInFlowOptions,
  useSignInCompletion,
} from './useSignInCompletion';

export type SignInFlow = {
  form: UseFormReturn<SignIn>;
  submit: FormSubmitHandler;
};

export function useSignIn({ onSignedIn }: SignInFlowOptions = {}): SignInFlow {
  const { authApi }: DomainApis = useDomainApis();
  const completeSignIn = useSignInCompletion({ onSignedIn });
  const form: UseFormReturn<SignIn> = useSignInForm();

  return {
    form,
    submit: form.handleSubmit((values) =>
      completeSignIn(authApi.signIn(values)),
    ),
  };
}
