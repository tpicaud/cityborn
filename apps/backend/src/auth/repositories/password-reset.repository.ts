import type { User, UserId } from '@cityborn/api';

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

export interface PasswordResetRepository {
  findEligibleUser(email: string): Promise<User | null>;
  replaceToken(
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  findTokenUser(tokenHash: string, now: Date): Promise<UserId | null>;
  consumeToken(tokenHash: string, now: Date): Promise<UserId | null>;
  updatePassword(
    userId: UserId,
    passwordHash: string,
  ): Promise<ResetPasswordAccount>;
}

export interface ResetPasswordAccount {
  user: User;
  sessionVersion: number;
}
