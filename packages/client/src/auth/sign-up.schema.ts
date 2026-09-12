import { CreateUserSchema } from '@cityborn/api';
import { z } from 'zod';

export const SignUpFormSchema = CreateUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;

export const SIGN_UP_FORM_DEFAULT_VALUES: SignUpFormValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};
