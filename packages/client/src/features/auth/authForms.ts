'use client';

import type {
  RequestPasswordReset,
  ResetPassword,
  SignIn,
} from '@cityborn/api';
import {
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  SignInSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import {
  type SignUpFormInput,
  SignUpFormSchema,
  type SignUpFormValues,
} from './authSchema';

const signInFormDefaultValues: SignIn = { identifier: '', password: '' };

const signUpFormDefaultValues: SignUpFormInput = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function useSignInForm(): UseFormReturn<SignIn> {
  return useForm<SignIn>({
    resolver: zodResolver(SignInSchema),
    defaultValues: signInFormDefaultValues,
  });
}

export function useSignUpForm(): UseFormReturn<
  SignUpFormInput,
  undefined,
  SignUpFormValues
> {
  return useForm<SignUpFormInput, undefined, SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: signUpFormDefaultValues,
  });
}

export function useRequestPasswordResetForm(): UseFormReturn<RequestPasswordReset> {
  return useForm<RequestPasswordReset>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: { email: '' },
  });
}

export function useResetPasswordForm(
  token: string,
): UseFormReturn<ResetPassword> {
  return useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    values: { token, password: '', confirmPassword: '' },
  });
}
