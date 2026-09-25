import { type User, type UserId, UserIdSchema } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type {
  PasswordResetToken,
  Prisma,
  User as PrismaUser,
} from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { UserMapper } from '../../user/user.mapper';
import type {
  PasswordResetRepository,
  ResetPasswordAccount,
} from './password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findEligibleUser(email: string): Promise<User | null> {
    const user: PrismaUser | null = await this.txHost.tx.user.findUnique({
      where: { email },
    });
    return user?.password ? UserMapper.toUser(user) : null;
  }

  async replaceToken(
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.txHost.tx.passwordResetToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt },
    });
  }

  async findTokenUser(tokenHash: string, now: Date): Promise<UserId | null> {
    const token: PasswordResetToken | null =
      await this.txHost.tx.passwordResetToken.findFirst({
        where: { tokenHash, expiresAt: { gt: now } },
      });
    return token ? UserIdSchema.parse(token.userId) : null;
  }

  async consumeToken(tokenHash: string, now: Date): Promise<UserId | null> {
    const userId: UserId | null = await this.findTokenUser(tokenHash, now);
    if (!userId) return null;
    const result: Prisma.BatchPayload =
      await this.txHost.tx.passwordResetToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: now } },
      });
    return result.count === 1 ? userId : null;
  }

  async updatePassword(
    userId: UserId,
    passwordHash: string,
  ): Promise<ResetPasswordAccount> {
    const user: PrismaUser = await this.txHost.tx.user.update({
      where: { id: userId, password: { not: null } },
      data: { password: passwordHash, sessionVersion: { increment: 1 } },
    });
    return {
      user: UserMapper.toUser(user),
      sessionVersion: user.sessionVersion,
    };
  }
}
