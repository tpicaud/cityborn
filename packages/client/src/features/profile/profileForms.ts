'use client';

import {
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

export type ChangePasswordFormInput = z.input<typeof ChangePasswordFormSchema>;
export type ChangePasswordFormValues = z.output<
  typeof ChangePasswordFormSchema
>;

const changePasswordDefaultValues: ChangePasswordFormInput = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export type UsernameFormInput = z.input<typeof UpdateUsernameSchema>;

export function useUsernameForm(
  username: string,
): UseFormReturn<UsernameFormInput, undefined, UpdateUsername> {
  return useForm<UsernameFormInput, undefined, UpdateUsername>({
    resolver: zodResolver(UpdateUsernameSchema),
    defaultValues: { username },
  });
}

export function useChangePasswordForm(): UseFormReturn<
  ChangePasswordFormInput,
  undefined,
  ChangePasswordFormValues
> {
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
