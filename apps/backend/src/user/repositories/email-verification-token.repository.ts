import type { UserId } from '@cityborn/api';

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
);

export type EmailVerificationToken = {
  id: string;
  userId: UserId;
  expiresAt: Date;
  createdAt: Date;
};

export type CreateEmailVerificationToken = Pick<
  EmailVerificationToken,
  'userId' | 'expiresAt'
> & {
  token: string;
};

export interface EmailVerificationTokenRepository {
  findLatestVerificationToken(
    userId: UserId,
  ): Promise<EmailVerificationToken | null>;
  findVerificationToken(
    verificationToken: string,
  ): Promise<EmailVerificationToken | null>;
  createVerificationToken(data: CreateEmailVerificationToken): Promise<void>;
  deleteVerificationToken(id: string): Promise<void>;
  deleteVerificationTokensByUserId(userId: UserId): Promise<void>;
}
