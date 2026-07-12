import type { User } from '@cityborn/api';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
