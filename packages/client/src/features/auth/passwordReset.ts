'use client';

import {
  type RequestPasswordReset,
  RequestPasswordResetSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateCurrentUser } from '../../domains/auth/authQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';
import {
  type PasswordResetFormInput,
  PasswordResetFormSchema,
  type PasswordResetFormValues,
  toResetPassword,
} from './authSchema';

export type PasswordResetRequestFlow = {
  form: UseFormReturn<RequestPasswordReset>;
  submit: FormSubmitHandler;
  requestedEmail: string | null;
};

export type PasswordResetFlowOptions = {
  passwordResetToken: string;
};

export type PasswordResetFlow = {
  form: UseFormReturn<
    PasswordResetFormInput,
    undefined,
    PasswordResetFormValues
  >;
  submit: FormSubmitHandler;
  isPasswordReset: boolean;
};

const passwordResetRequestDefaultValues: RequestPasswordReset = { email: '' };

const passwordResetDefaultValues: PasswordResetFormInput = {
  newPassword: '',
  confirmPassword: '',
};

export function usePasswordResetRequestFlow(): PasswordResetRequestFlow {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const form: UseFormReturn<RequestPasswordReset> =
    useForm<RequestPasswordReset>({
      resolver: zodResolver(RequestPasswordResetSchema),
      defaultValues: passwordResetRequestDefaultValues,
    });

  return {
    form,
    submit: form.handleSubmit(async (values) => {
      try {
        await authApi.requestPasswordReset(values);
        setRequestedEmail(values.email);
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    requestedEmail,
  };
}

export function usePasswordResetFlow({
  passwordResetToken,
}: PasswordResetFlowOptions): PasswordResetFlow {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [isPasswordReset, setIsPasswordReset] = useState<boolean>(false);
  const form: UseFormReturn<
    PasswordResetFormInput,
    undefined,
    PasswordResetFormValues
  > = useForm<PasswordResetFormInput, undefined, PasswordResetFormValues>({
    resolver: zodResolver(PasswordResetFormSchema),
    defaultValues: passwordResetDefaultValues,
  });

  return {
    form,
    submit: form.handleSubmit(async (values) => {
      try {
        await authApi.resetPassword(
          toResetPassword({ passwordResetToken, values }),
        );
        await invalidateCurrentUser(queryClient);
        setIsPasswordReset(true);
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    isPasswordReset,
  };
}
