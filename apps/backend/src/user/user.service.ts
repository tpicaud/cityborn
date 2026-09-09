import { randomBytes } from 'node:crypto';
import {
  type CreateGameRecord,
  ErrorCode,
  type GameRecord,
  SessionMode,
  type User,
  type UserId,
  type Username,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  GAME_RECORD_REPOSITORY,
  type GameRecordRepository,
} from '../game/repositories/game-record.repository';
import {
  type CreateUserData,
  USER_REPOSITORY,
  type UserRepository,
  type UserWithPassword,
} from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(GAME_RECORD_REPOSITORY)
    private readonly gameRecordRepository: GameRecordRepository,
  ) {}

  async createUser(data: CreateUserData): Promise<UserWithPassword> {
    return this.userRepository.create(data);
  }

  async deleteUser(user_id: UserId): Promise<void> {
    await this.userRepository.delete(user_id);
  }

  async findByIdentifier(identifier: string): Promise<UserWithPassword | null> {
    return this.userRepository.findByIdentifier(identifier);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByAppleId(appleUserId: string): Promise<UserWithPassword | null> {
    return this.userRepository.findByAppleId(appleUserId);
  }

  async validateIdentifiers(username: Username, email: string): Promise<void> {
    const existingUser = await this.userRepository.findByIdentifiers(
      username,
      email,
    );

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

  @Transactional()
  async createEmailVerificationToken(
    userId: UserId,
    cooldownMs?: number,
  ): Promise<string> {
    if (cooldownMs) {
      const existingToken =
        await this.userRepository.findLatestVerificationToken(userId);

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

    await this.userRepository.deleteVerificationTokens(userId);
    await this.userRepository.createVerificationToken({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async verifyEmail(verificationToken: string): Promise<User> {
    const token =
      await this.userRepository.findVerificationToken(verificationToken);

    if (!token || token.expiresAt < new Date()) {
      if (token) {
        await this.userRepository.deleteVerificationToken(token.id);
      }

      throw new UnauthorizedException({
        code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
        message: 'Email verification token is invalid or expired',
      });
    }

    return this.completeEmailVerification(token.userId);
  }

  async getGameRecords(user_id: UserId): Promise<GameRecord[]> {
    const gameRecords =
      await this.gameRecordRepository.findRecentByUserId(user_id);

    if (!gameRecords)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    return gameRecords;
  }

  async saveSoloGameRecord(
    user_id: UserId,
    createGameRecord: CreateGameRecord,
  ): Promise<void> {
    if (createGameRecord.mode !== SessionMode.SOLO) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot save game with this gameMode',
      });
    }

    await this.gameRecordRepository.create(createGameRecord, [{ id: user_id }]);
  }

  @Transactional()
  private async completeEmailVerification(userId: UserId): Promise<User> {
    const user = await this.userRepository.markEmailVerified(userId);
    await this.userRepository.deleteVerificationTokens(userId);
    return user;
  }
}
