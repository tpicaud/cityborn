import type { CreateUser } from '@cityborn/api';
import { CreateUserSchema } from '@cityborn/api';
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
