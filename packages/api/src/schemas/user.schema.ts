import { z } from 'zod';
import { GameRecordSchema } from './game.schema.js';

export const AccountTypeSchema = z.enum(['email', 'google', 'apple']);

export const PublicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export const UserSchema = PublicUserSchema.extend({
  email: z.string().email(),
  type: AccountTypeSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  relations: z
    .object({
      games: z.array(GameRecordSchema).optional(),
    })
    .optional(),
});

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(32),
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

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
