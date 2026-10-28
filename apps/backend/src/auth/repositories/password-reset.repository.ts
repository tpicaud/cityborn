import type { UserId } from '@cityborn/api';
import type { AuthVersion } from '../../common/types/auth-session';

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

export interface PasswordResetRepository {
  replaceToken(data: {
    userId: UserId;
    authVersion: AuthVersion;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<boolean>;
  consumeToken(data: { tokenHash: string; now: Date }): Promise<UserId | null>;
}
