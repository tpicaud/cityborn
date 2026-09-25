import type { User, UserId, Username } from '@cityborn/api';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserCredentials = {
  user: User;
  passwordHash: string | null;
  sessionVersion: number;
};

export type CreateUserData = Pick<User, 'email' | 'username' | 'type'> &
  Partial<Pick<User, 'isVerified'>> & {
    password?: string;
    appleId?: string;
  };

export interface UserRepository {
  findSessionVersion(id: UserId): Promise<number | null>;
  create(data: CreateUserData): Promise<User>;
  delete(user_id: UserId): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  findCredentialsByIdentifier(
    identifier: string,
  ): Promise<UserCredentials | null>;
  existsByUsername(username: string): Promise<boolean>;
  findByAppleId(appleUserId: string): Promise<User | null>;
  findByIdentifiers(
    username: Username,
    email: string,
  ): Promise<Pick<User, 'username' | 'email'> | null>;
  markEmailVerified(userId: UserId): Promise<User>;
}
