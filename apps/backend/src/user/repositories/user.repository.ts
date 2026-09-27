import type { User, UserId, Username } from '@cityborn/api';
import type {
  AuthSession,
  SessionVersion,
} from '../../common/types/auth-session';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserCredentials = {
  authSession: AuthSession;
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
  findAuthSessionById(id: UserId): Promise<AuthSession | null>;
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
  incrementSessionVersion(userId: UserId): Promise<SessionVersion>;
}
