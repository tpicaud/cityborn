import type { CreateUser, ResetPassword } from '@cityborn/api';
import { CreateUserSchema, ResetPasswordSchema } from '@cityborn/api';
import { z } from 'zod';

export const SignUpFormSchema = CreateUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type SignUpFormInput = z.input<typeof SignUpFormSchema>;
export type SignUpFormValues = z.output<typeof SignUpFormSchema>;

export function toCreateUser({
  username,
  email,
  password,
}: SignUpFormValues): CreateUser {
  return { username, email, password };
}

export const PasswordResetFormSchema = ResetPasswordSchema.omit({
  passwordResetToken: true,
})
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type PasswordResetFormInput = z.input<typeof PasswordResetFormSchema>;
export type PasswordResetFormValues = z.output<typeof PasswordResetFormSchema>;

export function toResetPassword({
  passwordResetToken,
  values: { newPassword },
}: {
  passwordResetToken: string;
  values: PasswordResetFormValues;
}): ResetPassword {
  return { passwordResetToken, newPassword };
}
