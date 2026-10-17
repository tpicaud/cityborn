import {
  type PublicUser,
  PublicUserSchema,
  type User,
  UserSchema,
} from '@cityborn/api';
import type { User as PrismaUser } from '@prisma/client';
import type { AuthSession } from '../common/types/auth-session';
import type { UserCredentials } from './repositories/user.repository';

export const UserMapper = {
  toUser(prismaUser: PrismaUser): User {
    return UserSchema.parse({
      id: prismaUser.id,
      type: prismaUser.type,
      role: prismaUser.role,
      email: prismaUser.email,
      username: prismaUser.username,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt?.toISOString(),
    });
  },

  toPublicUser(user: { id: string; username: string }): PublicUser {
    return PublicUserSchema.parse(user);
  },

  toUserCredentials(prismaUser: PrismaUser): UserCredentials {
    return {
      authSession: UserMapper.toAuthSession(prismaUser),
      passwordHash: prismaUser.password,
    };
  },

  toAuthSession(prismaUser: PrismaUser): AuthSession {
    return {
      user: UserMapper.toUser(prismaUser),
      authVersion: prismaUser.authVersion,
    };
  },
};
