import type { User, UserId } from '@cityborn/api';

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

export interface PasswordResetRepository {
  findEligibleUser(email: string): Promise<User | null>;
  replaceToken(data: {
    userId: UserId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findTokenUser(data: { tokenHash: string; now: Date }): Promise<UserId | null>;
  consumeToken(data: { tokenHash: string; now: Date }): Promise<UserId | null>;
}
