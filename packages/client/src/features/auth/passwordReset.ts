'use client';

import {
  ApiResponseError,
  ErrorCode,
  type PasswordResetRequestResponse,
  PasswordResetTokenSchema,
  type RequestPasswordReset,
  RequestPasswordResetSchema,
  type ResetPassword,
  ResetPasswordSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
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
  status: 'loading' | 'valid' | 'invalid' | 'verification-error' | 'success';
  retry: () => Promise<void>;
  submit: FormSubmitHandler;
};

const passwordResetRequestDefaultValues: RequestPasswordReset = { email: '' };

export function usePasswordResetRequestFlow(): PasswordResetRequestFlow {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [message, setMessage] = useState<string | null>(null);
  const submitting: RefObject<boolean> = useRef<boolean>(false);
  const form: UseFormReturn<RequestPasswordReset> =
    useForm<RequestPasswordReset>({
      resolver: zodResolver(RequestPasswordResetSchema),
      defaultValues: passwordResetRequestDefaultValues,
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
      form.reset(passwordResetRequestDefaultValues);
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
  const [status, setStatus] = useState<PasswordResetFlow['status']>('loading');
  const requestGeneration: RefObject<number> = useRef<number>(0);
  const submitting: RefObject<boolean> = useRef<boolean>(false);
  const form: UseFormReturn<ResetPassword> = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const retry: () => Promise<void> = useCallback(async (): Promise<void> => {
    const generation: number = ++requestGeneration.current;
    if (!PasswordResetTokenSchema.safeParse({ token }).success) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    try {
      await authApi.validatePasswordResetToken({ token });
      if (generation !== requestGeneration.current) return;
      setStatus('valid');
    } catch (error: unknown) {
      if (generation !== requestGeneration.current) return;
      if (
        error instanceof ApiResponseError &&
        error.code === ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN
      ) {
        setStatus('invalid');
        return;
      }
      setStatus('verification-error');
      reportError(error);
    }
  }, [authApi, reportError, token]);

  useEffect(() => {
    form.reset({ token, password: '', confirmPassword: '' });
    void retry();
    return () => {
      requestGeneration.current += 1;
    };
  }, [form, retry, token]);

  const submit: FormSubmitHandler = async (event) => {
    event?.preventDefault();
    if (submitting.current || status !== 'valid') return;
    submitting.current = true;
    const generation: number = requestGeneration.current;
    try {
      await form.handleSubmit(async (values: ResetPassword): Promise<void> => {
        if (generation !== requestGeneration.current) return;
        try {
          await authApi.resetPassword(values);
          if (generation !== requestGeneration.current) return;
          setStatus('success');
          onPasswordReset?.();
        } catch (error: unknown) {
          if (generation !== requestGeneration.current) return;
          if (
            error instanceof ApiResponseError &&
            error.code === ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN
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

  return { form, status, retry, submit };
}
