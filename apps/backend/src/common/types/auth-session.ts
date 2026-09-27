import type { User } from '@cityborn/api';
import { z } from 'zod';

export const SessionVersionSchema = z.number().int().nonnegative();

export type SessionVersion = z.infer<typeof SessionVersionSchema>;

export interface AuthSession {
  user: User;
  sessionVersion: SessionVersion;
}
