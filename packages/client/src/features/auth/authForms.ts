'use client';

import type { SignIn } from '@cityborn/api';
import { SignInSchema } from '@cityborn/api';
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
