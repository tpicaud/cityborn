import {
  type User,
  type UserId,
  type Username,
  UsernameSchema,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { UserMapper } from '../user.mapper';
import type {
  CreateUserData,
  UserCredentials,
  UserRepository,
} from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findSessionVersion(id: UserId): Promise<number | null> {
    const user: { sessionVersion: number } | null =
      await this.txHost.tx.user.findUnique({
        where: { id },
        select: { sessionVersion: true },
      });
    return user?.sessionVersion ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.txHost.tx.user.create({ data });
    return UserMapper.toUser(user);
  }

  async delete(user_id: UserId): Promise<void> {
    await this.txHost.tx.user.delete({ where: { id: user_id } });
  }

  async findById(id: UserId): Promise<User | null> {
    const user = await this.txHost.tx.user.findUnique({ where: { id } });
    return user ? UserMapper.toUser(user) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const user = await this.txHost.tx.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    return user ? UserMapper.toUser(user) : null;
  }

  async findCredentialsByIdentifier(
    identifier: string,
  ): Promise<UserCredentials | null> {
    const user = await this.txHost.tx.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
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
    const existingUser = await this.txHost.tx.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    return existingUser
      ? {
          username: UsernameSchema.parse(existingUser.username),
          email: existingUser.email,
        }
      : null;
  }

  async markEmailVerified(userId: UserId): Promise<User> {
    const user = await this.txHost.tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    return UserMapper.toUser(user);
  }
}
