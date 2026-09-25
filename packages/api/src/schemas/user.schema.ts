import { z } from 'zod';
import { UserIdSchema, UsernameSchema } from './common.schema';
import { GameRecordSchema } from './game.schema';

export const AccountTypeSchema = z.enum(['email', 'google', 'apple']);

export const PublicUserSchema = z.object({
  id: UserIdSchema,
  username: UsernameSchema,
});

export const UserSchema = PublicUserSchema.extend({
  email: z.string().email(),
  type: AccountTypeSchema,
  isVerified: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  relations: z
    .object({
      games: z.array(GameRecordSchema).optional(),
    })
    .optional(),
});

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(20).pipe(UsernameSchema),
  email: z.string().email(),
  password: z
    .string()
    .min(6)
    .max(32)
    .regex(
      /^(?=.*[A-Z])(?=.*\d).+$/,
      'Le mot de passe doit contenir au moins une majuscule et un chiffre',
    ),
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

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type SignInWithGoogle = z.infer<typeof SignInWithGoogleSchema>;
export type SignInWithApple = z.infer<typeof SignInWithAppleSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type VerifyEmailData = z.infer<typeof VerifyEmailDataSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email(),
});

export const PasswordResetTokenSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
});

export const ResetPasswordSchema = PasswordResetTokenSchema.extend({
  password: CreateUserSchema.shape.password,
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
export type PasswordResetToken = z.infer<typeof PasswordResetTokenSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type PasswordResetRequestResponse = z.infer<
  typeof PasswordResetRequestResponseSchema
>;
