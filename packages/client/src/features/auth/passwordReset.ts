'use client';

import {
  ApiResponseError,
  ErrorCode,
  type PasswordResetRequestResponse,
  type RequestPasswordReset,
  RequestPasswordResetSchema,
  type ResetPassword,
  ResetPasswordSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RefObject, useRef, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';

export type PasswordResetRequestFlow = {
  form: UseFormReturn<RequestPasswordReset>;
  message: string | null;
  reset: () => void;
  submit: FormSubmitHandler;
};

export type PasswordResetFlowOptions = {
  token: string;
  onPasswordReset?: () => void;
};

export type PasswordResetFlow = {
  form: UseFormReturn<ResetPassword>;
  status: 'ready' | 'invalid' | 'success';
  submit: FormSubmitHandler;
};

export function usePasswordResetRequestFlow(): PasswordResetRequestFlow {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [message, setMessage] = useState<string | null>(null);
  const submitting: RefObject<boolean> = useRef<boolean>(false);
  const form: UseFormReturn<RequestPasswordReset> =
    useForm<RequestPasswordReset>({
      resolver: zodResolver(RequestPasswordResetSchema),
      defaultValues: { email: '' },
    });

  const submit: FormSubmitHandler = async (event) => {
    event?.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      await form.handleSubmit(
        async (values: RequestPasswordReset): Promise<void> => {
          try {
            const response: PasswordResetRequestResponse =
              await authApi.requestPasswordReset(values);
            setMessage(response.message);
          } catch (error: unknown) {
            reportError(error);
          }
        },
      )(event);
    } finally {
      submitting.current = false;
    }
  };

  return {
    form,
    message,
    reset: () => {
      if (submitting.current) return;
      form.reset({ email: '' });
      setMessage(null);
    },
    submit,
  };
}

export function usePasswordResetFlow({
  token,
  onPasswordReset,
}: PasswordResetFlowOptions): PasswordResetFlow {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [status, setStatus] = useState<PasswordResetFlow['status']>(
    token ? 'ready' : 'invalid',
  );
  const submitting: RefObject<boolean> = useRef<boolean>(false);
  const form: UseFormReturn<ResetPassword> = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const submit: FormSubmitHandler = async (event) => {
    event?.preventDefault();
    if (submitting.current || status !== 'ready') return;
    submitting.current = true;
    try {
      await form.handleSubmit(async (values: ResetPassword): Promise<void> => {
        try {
          await authApi.resetPassword(values);
          setStatus('success');
          onPasswordReset?.();
        } catch (error: unknown) {
          if (
            error instanceof ApiResponseError &&
            error.code === ErrorCode.USER_INVALID_TOKEN
          ) {
            setStatus('invalid');
            return;
          }
          reportError(error);
        }
      })(event);
    } finally {
      submitting.current = false;
    }
  };

  return { form, status, submit };
}
