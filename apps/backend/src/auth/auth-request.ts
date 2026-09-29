import type { Request } from 'express';
import type { AuthSession } from '../common/types/auth-session';

export interface AuthRequest extends Request {
  authSession?: AuthSession;
}
