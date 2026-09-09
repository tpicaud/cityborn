import {
  GameRecordSchema,
  type PublicUser,
  PublicUserSchema,
  type User,
  UserSchema,
} from '@cityborn/api';
import type {
  EmailVerificationToken as PrismaEmailVerificationToken,
  GameRecord as PrismaGameRecord,
  User as PrismaUser,
} from '@prisma/client';
import type {
  EmailVerificationToken,
  UserWithPassword,
} from './repositories/user.repository';

type PrismaUserWithRelations = PrismaUser & {
  gameRecords?: PrismaGameRecord[];
};

export const UserMapper = {
  toUser(prismaUser: PrismaUserWithRelations): User {
    return UserSchema.parse({
      id: prismaUser.id,
      type: prismaUser.type,
      email: prismaUser.email,
      username: prismaUser.username,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt?.toISOString(),
      relations: {
        games: prismaUser.gameRecords
          ? prismaUser.gameRecords.map((game) =>
              GameRecordSchema.parse({
                id: game.id,
                mode: game.mode,
                gameConfig: game.gameConfig,
                players: game.players,
                guessObjectsIds: game.guessObjectsIds,
                results: game.results,
                createdAt: game.createdAt.toISOString(),
              }),
            )
          : undefined,
      },
    });
  },

  toPublicUser(user: { id: string; username: string }): PublicUser {
    return PublicUserSchema.parse(user);
  },

  toUserWithPassword(prismaUser: PrismaUser): UserWithPassword {
    return {
      ...UserMapper.toUser(prismaUser),
      password: prismaUser.password,
    };
  },

  toVerificationToken(
    prismaToken: PrismaEmailVerificationToken,
  ): EmailVerificationToken {
    return {
      id: prismaToken.id,
      userId: prismaToken.userId,
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
    };
  },
};
