import {
  AccountType,
  GameConfig,
  Player,
  PlayerResults,
  PublicUser,
  SessionMode,
  User,
} from '@cityborn/api';
import type {
  GameRecord as PrismaGameRecord,
  User as PrismaUser,
} from '@prisma/client';

type PrismaUserWithRelations = PrismaUser & {
  gameRecords?: PrismaGameRecord[];
};
export const UserMapper = {
  toUser(prismaUser: PrismaUserWithRelations): User {
    return {
      id: prismaUser.id,
      type: prismaUser.type as AccountType,
      email: prismaUser.email,
      username: prismaUser.username,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt
        ? prismaUser.updatedAt.toISOString()
        : undefined,
      relations: {
        games: prismaUser.gameRecords?.map((game) => ({
          id: game.id,
          mode: game.mode as SessionMode,
          gameConfig: game.gameConfig as unknown as GameConfig,
          players: game.players as unknown as Player[],
          guessObjectsIds: game.guessObjectsIds,
          results: game.results as unknown as Record<string, PlayerResults>,
          createdAt: game.createdAt.toISOString(),
        })),
      },
    };
  },

  toPublicUser(user: { id: string; username: string }): PublicUser {
    return {
      id: user.id,
      username: user.username,
    };
  },
};
