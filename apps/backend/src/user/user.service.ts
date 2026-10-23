import { randomBytes } from 'node:crypto';
import {
  ErrorCode,
  type User,
  type UserId,
  type Username,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { AuthSession, AuthVersion } from '../common/types/auth-session';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationToken,
  type EmailVerificationTokenRepository,
} from './repositories/email-verification-token.repository';
import {
  type CreateUserData,
  type UnverifiedAccountReclaim,
  USER_REPOSITORY,
  type UserCredentials,
  type UserRepository,
} from './repositories/user.repository';

function invalidVerificationTokenException(): UnauthorizedException {
  return new UnauthorizedException({
    code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
    message: 'Email verification token is invalid',
  });
}

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }

  async deleteUser(user_id: UserId): Promise<void> {
    await this.userRepository.delete(user_id);
  }

  async findAuthSessionById(userId: UserId): Promise<AuthSession | null> {
    return this.userRepository.findAuthSessionById(userId);
  }

  async incrementAuthVersion(userId: UserId): Promise<AuthVersion> {
    return this.userRepository.incrementAuthVersion(userId);
  }

  async reclaimUnverifiedAccount(
    reclaim: UnverifiedAccountReclaim,
  ): Promise<AuthSession> {
    return this.userRepository.reclaimUnverifiedAccount(reclaim);
  }

  async findCredentialsById(userId: UserId): Promise<UserCredentials | null> {
    return this.userRepository.findCredentialsById(userId);
  }

  async findPasswordResetAuthSession(
    email: string,
  ): Promise<AuthSession | null> {
    const credentials: UserCredentials | null =
      await this.userRepository.findCredentialsByEmail(email);
    return credentials?.passwordHash ? credentials.authSession : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepository.findByIdentifier(identifier);
  }

  async findCredentialsByIdentifier(
    identifier: string,
  ): Promise<UserCredentials | null> {
    return this.userRepository.findCredentialsByIdentifier(identifier);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.userRepository.existsByUsername(username);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByAppleId(appleUserId: string): Promise<User | null> {
    return this.userRepository.findByAppleId(appleUserId);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async assertUsernameAvailable(username: Username): Promise<void> {
    const usernameExists: boolean =
      await this.userRepository.existsByUsername(username);
    if (usernameExists)
      throw new ConflictException({
        code: ErrorCode.USER_USERNAME_ALREADY_EXISTS,
        message: 'Username already exists',
      });
  }

  async updateUsername(user: User, username: Username): Promise<User> {
    if (user.username === username) return user;

    await this.assertUsernameAvailable(username);

    return this.userRepository.updateUsername(user.id, username);
  }

  @Transactional()
  async updateEmail({
    user,
    email,
  }: {
    user: User;
    email: string;
  }): Promise<User> {
    if (user.isVerified)
      throw new ForbiddenException({
        code: ErrorCode.USER_EMAIL_ALREADY_VERIFIED,
        message: 'A verified email cannot be changed',
      });

    if (user.email === email) return user;

    const emailOwner: User | null =
      await this.userRepository.findByEmail(email);
    if (emailOwner)
      throw new ConflictException({
        code: ErrorCode.USER_EMAIL_ALREADY_TAKEN,
        message: 'Email already taken',
      });

    const updatedUser: User = await this.userRepository.updateEmail({
      userId: user.id,
      email,
    });
    await this.emailVerificationTokenRepository.deleteVerificationTokensByUserId(
      user.id,
    );
    return updatedUser;
  }

  @Transactional()
  async updatePassword(
    userId: UserId,
    passwordHash: string,
  ): Promise<AuthVersion> {
    await this.userRepository.updatePassword(userId, passwordHash);
    return this.userRepository.incrementAuthVersion(userId);
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
        await this.emailVerificationTokenRepository.findLatestVerificationToken(
          userId,
        );

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

    await this.emailVerificationTokenRepository.deleteVerificationTokensByUserId(
      userId,
    );
    await this.emailVerificationTokenRepository.createVerificationToken({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async verifyEmail(verificationToken: string): Promise<User> {
    const token: EmailVerificationToken | null =
      await this.emailVerificationTokenRepository.findVerificationToken(
        verificationToken,
      );

    if (!token) throw invalidVerificationTokenException();

    if (token.expiresAt < new Date())
      throw new UnauthorizedException({
        code: ErrorCode.USER_VERIFICATION_EMAIL_EXPIRED_TOKEN,
        message: 'Email verification token is expired',
      });

    return this.completeEmailVerification(token.userId);
  }

  async findVerificationTokenOwner(verificationToken: string): Promise<User> {
    const token: EmailVerificationToken | null =
      await this.emailVerificationTokenRepository.findVerificationToken(
        verificationToken,
      );
    const owner: User | null = token
      ? await this.userRepository.findById(token.userId)
      : null;

    if (!owner) throw invalidVerificationTokenException();

    return owner;
  }

  @Transactional()
  private async completeEmailVerification(userId: UserId): Promise<User> {
    const user = await this.userRepository.markEmailVerified(userId);
    await this.emailVerificationTokenRepository.deleteVerificationTokensByUserId(
      userId,
    );
    return user;
  }
}
