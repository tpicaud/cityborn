import type { AuthenticationContext } from '../common/types/authentication';

declare global {
  namespace Express {
    interface Request {
      authentication?: AuthenticationContext;
    }
  }
}
