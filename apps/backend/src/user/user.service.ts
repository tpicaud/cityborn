import { randomBytes } from 'node:crypto';
import {
  AccountType,
  type CreateGameRecord,
  ErrorCode,
  GameRecord,
  SessionMode,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { GameMapper } from '../game/game.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: {
    email: string;
    username: string;
    type: AccountType;
    isVerified?: boolean;
    password?: string;
    appleId?: string;
  }): Promise<PrismaUser> {
    return await this.prisma.user.create({ data });
  }

  async deleteUser(user_id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: user_id },
    });
  }

  async findByIdentifier(identifier: string): Promise<PrismaUser | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async findById(id: string): Promise<PrismaUser | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByAppleId(appleUserId: string): Promise<PrismaUser | null> {
    return await this.prisma.user.findFirst({
      where: {
        appleId: appleUserId,
      },
    });
  }

  async validateIdentifiers(username: string, email: string): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (!existingUser) return;

    if (existingUser.username === username) {
      throw new ConflictException({
        code: ErrorCode.USER_USERNAME_ALREADY_EXISTS,
        message: 'Username already exists',
      });
    }

    if (existingUser.email === email) {
      throw new ConflictException({
        code: ErrorCode.USER_EMAIL_ALREADY_TAKEN,
        message: 'Email already taken',
      });
    }
  }

  async createEmailVerificationToken(
    userId: string,
    cooldownMs?: number,
  ): Promise<string> {
    if (cooldownMs) {
      const existingToken = await this.prisma.emailVerificationToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (
        existingToken &&
        Date.now() - existingToken.createdAt.getTime() < cooldownMs
      ) {
        throw new BadRequestException({
          code: ErrorCode.USER_VERIFICATION_EMAIL_RESEND_TOO_SOON,
          message: 'Please wait before requesting another verification email',
        });
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({
        where: { userId },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          token,
          expiresAt,
          user: {
            connect: { id: userId },
          },
        },
      }),
    ]);

    return token;
  }

  async verifyEmail(verificationToken: string): Promise<PrismaUser> {
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { token: verificationToken },
    });

    if (!token || token.expiresAt < new Date()) {
      if (token) {
        await this.prisma.emailVerificationToken.delete({
          where: { id: token.id },
        });
      }

      throw new UnauthorizedException({
        code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
        message: 'Email verification token is invalid or expired',
      });
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { isVerified: true },
      }),
      this.prisma.emailVerificationToken.deleteMany({
        where: { userId: token.userId },
      }),
    ]);

    return user;
  }

  ///////////////
  // Relations //
  ///////////////
  async getGameRecords(user_id: string): Promise<GameRecord[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
      include: {
        gameRecords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    return GameMapper.toGameRecord(user.gameRecords);
  }

  async saveSoloGameRecord(
    user_id: string,
    createGameRecord: CreateGameRecord,
  ): Promise<void> {
    if (createGameRecord.mode !== SessionMode.SOLO) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot save game with this gameMode',
      });
    }

    await this.prisma.gameRecord.create({
      data: {
        mode: createGameRecord.mode,
        gameConfig:
          createGameRecord.gameConfig as unknown as Prisma.InputJsonValue,
        players: createGameRecord.players as unknown as Prisma.InputJsonValue,
        guessObjectsIds: createGameRecord.guessObjectsIds,
        results: createGameRecord.results as unknown as Prisma.InputJsonValue,
        users: {
          connect: { id: user_id },
        },
      },
    });
  }
}
