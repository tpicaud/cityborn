import { z } from 'zod';
import { UsernameInputSchema, UserSchema } from '../user/user.schema';

export const PasswordSchema = z
  .string()
  .min(6)
  .max(32)
  .regex(
    /^(?=.*[A-Z])(?=.*\d).+$/,
    'Le mot de passe doit contenir au moins une majuscule et un chiffre',
  );

export const CreateUserSchema = z.object({
  username: UsernameInputSchema,
  email: z.string().email(),
  password: PasswordSchema,
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});

export const SignInSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const SignInWithGoogleSchema = z.object({
  idToken: z.string(),
});

export const SignInWithAppleSchema = z.object({
  identity_token: z.string(),
  apple_user_id: z.string(),
  details: z
    .object({
      email: z.string().email(),
      family_name: z.string(),
      given_name: z.string(),
    })
    .optional(),
});

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: UserSchema,
});

export const VerifyEmailDataSchema = z.object({
  verification_token: z.string(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdatePassword = z.infer<typeof UpdatePasswordSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type SignInWithGoogle = z.infer<typeof SignInWithGoogleSchema>;
export type SignInWithApple = z.infer<typeof SignInWithAppleSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type VerifyEmailData = z.infer<typeof VerifyEmailDataSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email(),
});

const PasswordResetTokenSchema = z.object({
  token: z.string().min(1),
});

export const ResetPasswordSchema = PasswordResetTokenSchema.extend({
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const PASSWORD_RESET_REQUEST_MESSAGE: string =
  'Si un compte éligible correspond à cette adresse, vous recevrez un e-mail de réinitialisation.';

export const PasswordResetRequestResponseSchema = z.object({
  message: z.string(),
});

export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type PasswordResetRequestResponse = z.infer<
  typeof PasswordResetRequestResponseSchema
>;
