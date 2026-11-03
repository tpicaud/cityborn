'use client';

import {
  type UpdateEmail,
  UpdateEmailSchema,
  type UpdatePassword,
  UpdatePasswordSchema,
  type UpdateUsername,
  UpdateUsernameSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

export const ChangePasswordFormSchema = UpdatePasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ChangePasswordFormInput = z.input<typeof ChangePasswordFormSchema>;
export type ChangePasswordFormValues = z.output<
  typeof ChangePasswordFormSchema
>;

const changePasswordDefaultValues: ChangePasswordFormInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

type UsernameFormInput = z.input<typeof UpdateUsernameSchema>;

export type UsernameForm = UseFormReturn<
  UsernameFormInput,
  undefined,
  UpdateUsername
>;

export type EmailForm = UseFormReturn<UpdateEmail>;

export type ChangePasswordForm = UseFormReturn<
  ChangePasswordFormInput,
  undefined,
  ChangePasswordFormValues
>;

export function useUsernameForm(username: string): UsernameForm {
  return useForm<UsernameFormInput, undefined, UpdateUsername>({
    resolver: zodResolver(UpdateUsernameSchema),
    defaultValues: { username },
  });
}

export function useEmailForm(email: string): EmailForm {
  return useForm<UpdateEmail>({
    resolver: zodResolver(UpdateEmailSchema),
    defaultValues: { email },
  });
}

export function useChangePasswordForm(): ChangePasswordForm {
  return useForm<ChangePasswordFormInput, undefined, ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: changePasswordDefaultValues,
  });
}

export function toUpdatePassword({
  currentPassword,
  newPassword,
}: ChangePasswordFormValues): UpdatePassword {
  return { currentPassword, newPassword };
}
