import type { UserId } from '@cityborn/api';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

export type PasswordResetToken = {
  id: string;
  userId: UserId;
  expiresAt: Date;
  createdAt: Date;
};

export type CreatePasswordResetToken = Pick<
  PasswordResetToken,
  'userId' | 'expiresAt'
> & {
  tokenHash: string;
};

export interface PasswordResetTokenRepository {
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  create(data: CreatePasswordResetToken): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
}
