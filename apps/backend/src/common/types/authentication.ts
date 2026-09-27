import type { User, UserId } from '@cityborn/api';
import { z } from 'zod';

export const SessionVersionSchema = z.number().int().nonnegative();

export type SessionVersion = z.infer<typeof SessionVersionSchema>;

export interface AuthenticationContext {
  user: User;
  sessionVersion: SessionVersion;
}

export type SocketAuthentication =
  | { status: 'anonymous' }
  | {
      status: 'pending';
      userId: UserId;
      sessionVersion: SessionVersion;
    }
  | ({ status: 'authenticated' } & AuthenticationContext);
