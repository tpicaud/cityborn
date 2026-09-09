import type { User, UserId, Username } from '@cityborn/api';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserWithPassword = User & {
  password: string | null;
};

export type CreateUserData = Pick<User, 'email' | 'username' | 'type'> &
  Partial<Pick<User, 'isVerified'>> & {
    password?: string;
    appleId?: string;
  };

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

export interface UserRepository {
  create(data: CreateUserData): Promise<UserWithPassword>;
  delete(user_id: UserId): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<UserWithPassword | null>;
  findByAppleId(apple_user_id: string): Promise<UserWithPassword | null>;
  findByIdentifiers(
    username: Username,
    email: string,
  ): Promise<Pick<User, 'username' | 'email'> | null>;
  findLatestVerificationToken(
    userId: UserId,
  ): Promise<EmailVerificationToken | null>;
  findVerificationToken(
    verificationToken: string,
  ): Promise<EmailVerificationToken | null>;
  createVerificationToken(data: CreateEmailVerificationToken): Promise<void>;
  deleteVerificationToken(id: string): Promise<void>;
  deleteVerificationTokens(userId: UserId): Promise<void>;
  markEmailVerified(userId: UserId): Promise<User>;
}
