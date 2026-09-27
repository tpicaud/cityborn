import type { User } from '@cityborn/api';
import { z } from 'zod';

export const AuthVersionSchema = z.number().int().nonnegative();

export type AuthVersion = z.infer<typeof AuthVersionSchema>;

export interface AuthSession {
  user: User;
  authVersion: AuthVersion;
}
