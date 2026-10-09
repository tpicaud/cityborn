'use client';

import type { UseFormReturn } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../../shared/apiProvider';
import {
  type SignUpFormInput,
  type SignUpFormValues,
  toCreateUser,
} from '../authSchema';
import { type FormSubmitHandler, useSignUpForm } from './authForms';
import {
  type SignInFlowOptions,
  useSignInCompletion,
} from './useSignInCompletion';

export type SignUpFlow = {
  form: UseFormReturn<SignUpFormInput, undefined, SignUpFormValues>;
  submit: FormSubmitHandler;
};

export function useSignUp({ onSignedIn }: SignInFlowOptions = {}): SignUpFlow {
  const { authApi }: DomainApis = useDomainApis();
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
