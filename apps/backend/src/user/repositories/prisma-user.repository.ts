import type { User, UserId, Username } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { UserMapper } from '../user.mapper';
import type {
  CreateEmailVerificationToken,
  CreateUserData,
  EmailVerificationToken,
  UserRepository,
  UserWithPassword,
} from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async create(data: CreateUserData): Promise<UserWithPassword> {
    const user = await this.txHost.tx.user.create({ data });
    return UserMapper.toUserWithPassword(user);
  }

  async delete(user_id: UserId): Promise<void> {
    await this.txHost.tx.user.delete({ where: { id: user_id } });
  }

  async findById(id: UserId): Promise<User | null> {
    const user = await this.txHost.tx.user.findUnique({ where: { id } });
    return user ? UserMapper.toUser(user) : null;
  }

  async findByIdentifier(identifier: string): Promise<UserWithPassword | null> {
    const user = await this.txHost.tx.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    return user ? UserMapper.toUserWithPassword(user) : null;
  }

  async findByAppleId(apple_user_id: string): Promise<UserWithPassword | null> {
    const user = await this.txHost.tx.user.findFirst({
      where: { appleId: apple_user_id },
    });
    return user ? UserMapper.toUserWithPassword(user) : null;
  }

  async findByIdentifiers(
    username: Username,
    email: string,
  ): Promise<Pick<User, 'username' | 'email'> | null> {
    const existingUser = await this.txHost.tx.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    return existingUser
      ? { username: existingUser.username, email: existingUser.email }
      : null;
  }

  async findLatestVerificationToken(
    userId: UserId,
  ): Promise<EmailVerificationToken | null> {
    const existingToken = await this.txHost.tx.emailVerificationToken.findFirst(
      {
        where: { userId },
        orderBy: { createdAt: 'desc' },
      },
    );
    return existingToken ? UserMapper.toVerificationToken(existingToken) : null;
  }

  async findVerificationToken(
    verificationToken: string,
  ): Promise<EmailVerificationToken | null> {
    const token = await this.txHost.tx.emailVerificationToken.findUnique({
      where: { token: verificationToken },
    });
    return token ? UserMapper.toVerificationToken(token) : null;
  }

  async createVerificationToken(
    data: CreateEmailVerificationToken,
  ): Promise<void> {
    await this.txHost.tx.emailVerificationToken.create({
      data: {
        token: data.token,
        expiresAt: data.expiresAt,
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }

  async deleteVerificationToken(id: string): Promise<void> {
    await this.txHost.tx.emailVerificationToken.delete({ where: { id } });
  }

  async deleteVerificationTokens(userId: UserId): Promise<void> {
    await this.txHost.tx.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  async markEmailVerified(userId: UserId): Promise<User> {
    const user = await this.txHost.tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    return UserMapper.toUser(user);
  }
}
