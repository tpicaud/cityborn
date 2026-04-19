import {
  GameConfig,
  Player,
  PlayerResults,
  SessionMode,
  User,
} from '@cityborn/types';
import {
  User as PrismaUser,
  GameRecord as PrismaGameRecord,
} from '@prisma/client';
import { UserDto } from './dto/user.dto';
import { PublicUserDto } from './dto/public-user.dto';

type PrismaUserWithRelations = PrismaUser & {
  gameRecords?: PrismaGameRecord[];
};
export class UserMapper {
  static toUserDto(prismaUser: PrismaUserWithRelations): UserDto {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
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
  }

  static toPublicUserDto(user: User): PublicUserDto {
    return {
      id: user.id,
      username: user.username,
    };
  }
}
