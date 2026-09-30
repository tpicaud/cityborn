import type { Request } from 'express';
import type { AuthSession } from '../common/types/auth-session';

export type AuthRequest = Request & {
  authSession?: AuthSession;
};
