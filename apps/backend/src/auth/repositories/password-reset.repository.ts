import type { UserId } from '@cityborn/api';

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

export interface PasswordResetRepository {
  replaceToken(data: {
    userId: UserId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  consumeToken(data: { tokenHash: string; now: Date }): Promise<UserId | null>;
}
