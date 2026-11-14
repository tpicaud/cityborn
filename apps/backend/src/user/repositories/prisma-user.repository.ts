import {
  type User,
  type UserId,
  type Username,
  UsernameSchema,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { Prisma, User as PrismaUser } from '@prisma/client';
import type { AuthSession, AuthVersion } from '../../common/types/auth-session';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { UserMapper } from '../user.mapper';
import {
  type CreateUserData,
  EmailCollisionError,
  type UnverifiedAccountReclaim,
  type UserCredentials,
  type UserRepository,
} from './user.repository';

function emailFilter(email: string): Prisma.StringFilter {
  return { equals: email.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' };
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const user: PrismaUser = await this.txHost.tx.user.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
    return UserMapper.toUser(user);
  }

  async delete(user_id: UserId): Promise<void> {
    await this.txHost.tx.user.delete({ where: { id: user_id } });
  }

  async findAuthSessionById(id: UserId): Promise<AuthSession | null> {
    const user: PrismaUser | null = await this.txHost.tx.user.findUnique({
      where: { id },
    });
    return user ? UserMapper.toAuthSession(user) : null;
  }

  async findById(id: UserId): Promise<User | null> {
    const user = await this.txHost.tx.user.findUnique({ where: { id } });
    return user ? UserMapper.toUser(user) : null;
  }

  async findCredentialsById(id: UserId): Promise<UserCredentials | null> {
    const user: PrismaUser | null = await this.txHost.tx.user.findUnique({
      where: { id },
    });
    return user ? UserMapper.toUserCredentials(user) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user: PrismaUser | null = await this.findUniqueEmailUser(email);
    return user ? UserMapper.toUserCredentials(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user: PrismaUser | null = await this.findUniqueEmailUser(email);
    return user ? UserMapper.toUser(user) : null;
  }

  async findCredentialsByIdentifier(
    identifier: string,
  ): Promise<UserCredentials | null> {
    const emailCredentials: UserCredentials | null =
      await this.findCredentialsByEmail(identifier);
    if (emailCredentials) return emailCredentials;

    const user: PrismaUser | null = await this.txHost.tx.user.findUnique({
      where: { username: identifier },
    });
    return user ? UserMapper.toUserCredentials(user) : null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.txHost.tx.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return user !== null;
  }

  async findByAppleId(appleUserId: string): Promise<User | null> {
    const user = await this.txHost.tx.user.findFirst({
      where: { appleId: appleUserId },
    });
    return user ? UserMapper.toUser(user) : null;
  }

  async findByIdentifiers(
    username: Username,
    email: string,
  ): Promise<Pick<User, 'username' | 'email'> | null> {
    const emailUser: PrismaUser | null = await this.findUniqueEmailUser(email);
    const existingUser: PrismaUser | null =
      emailUser ??
      (await this.txHost.tx.user.findUnique({ where: { username } }));
    return existingUser
      ? {
          username: UsernameSchema.parse(existingUser.username),
          email: existingUser.email,
        }
      : null;
  }

  async markEmailVerified({
    userId,
    email,
  }: {
    userId: UserId;
    email: string;
  }): Promise<User | null> {
    const updated: { count: number } = await this.txHost.tx.user.updateMany({
      where: { id: userId, email: emailFilter(email) },
      data: { isVerified: true },
    });
    if (updated.count === 0) return null;
    return this.findById(userId);
  }

  async updateUsername(userId: UserId, username: Username): Promise<User> {
    const user: PrismaUser = await this.txHost.tx.user.update({
      where: { id: userId },
      data: { username },
    });
    return UserMapper.toUser(user);
  }

  async updateEmail({
    userId,
    email,
  }: {
    userId: UserId;
    email: string;
  }): Promise<User | null> {
    const updated: { count: number } = await this.txHost.tx.user.updateMany({
      where: { id: userId, isVerified: false },
      data: { email: email.toLowerCase() },
    });
    if (updated.count === 0) return null;
    return this.findById(userId);
  }

  private async findUniqueEmailUser(email: string): Promise<PrismaUser | null> {
    const users: PrismaUser[] = await this.txHost.tx.user.findMany({
      where: { email: emailFilter(email) },
      take: 2,
    });
    if (users.length > 1)
      throw new EmailCollisionError('Multiple accounts use this email');
    return users[0] ?? null;
  }

  async deletePasswordResetTokensByUserId(userId: UserId): Promise<void> {
    await this.txHost.tx.passwordResetToken.deleteMany({ where: { userId } });
  }

  async updatePassword(userId: UserId, passwordHash: string): Promise<void> {
    await this.txHost.tx.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
    await this.txHost.tx.passwordResetToken.deleteMany({ where: { userId } });
  }

  async incrementAuthVersion(userId: UserId): Promise<AuthVersion> {
    const user: { authVersion: number } = await this.txHost.tx.user.update({
      where: { id: userId },
      data: { authVersion: { increment: 1 } },
      select: { authVersion: true },
    });
    return user.authVersion;
  }

  async reclaimUnverifiedAccount({
    userId,
    type,
    appleId,
  }: UnverifiedAccountReclaim): Promise<AuthSession> {
    const user: PrismaUser = await this.txHost.tx.user.update({
      where: { id: userId },
      data: {
        password: null,
        isVerified: true,
        type,
        appleId,
        authVersion: { increment: 1 },
      },
    });
    return UserMapper.toAuthSession(user);
  }
}
