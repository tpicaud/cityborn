import type { Request } from 'express';
import type { AuthSession } from './auth-session';

export interface AppRequest extends Request {
  authSession?: AuthSession;
}
