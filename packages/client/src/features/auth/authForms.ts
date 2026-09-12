'use client';

import type { SignIn } from '@cityborn/api';
import { SignInSchema } from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { SignUpFormSchema, type SignUpFormValues } from './authSchema';

const signInFormDefaultValues: SignIn = { identifier: '', password: '' };

const signUpFormDefaultValues: SignUpFormValues = {
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

export function useSignUpForm(): UseFormReturn<SignUpFormValues> {
  return useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: signUpFormDefaultValues,
  });
}
