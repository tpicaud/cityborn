import type { User, UserId, Username } from '@cityborn/api';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserAuthenticationState = {
  user: User;
  authVersion: number;
};

export type UserCredentials = UserAuthenticationState & {
  passwordHash: string | null;
};

export type CreateUserData = Pick<User, 'email' | 'username' | 'type'> &
  Partial<Pick<User, 'isVerified'>> & {
    password?: string;
    appleId?: string;
  };

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  delete(user_id: UserId): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findAuthenticationStateById(
    id: UserId,
  ): Promise<UserAuthenticationState | null>;
  findCredentialsById(id: UserId): Promise<UserCredentials | null>;
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
  updateUsername(userId: UserId, username: Username): Promise<User>;
  updatePassword(
    userId: UserId,
    passwordHash: string,
  ): Promise<UserAuthenticationState>;
}
