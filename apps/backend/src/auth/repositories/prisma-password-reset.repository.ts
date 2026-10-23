import { type UserId, UserIdSchema } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PasswordResetToken, Prisma } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import type { PasswordResetRepository } from './password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async replaceToken({
    userId,
    tokenHash,
    expiresAt,
  }: {
    userId: UserId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.txHost.tx.passwordResetToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt },
    });
  }

  private async findTokenUser({
    tokenHash,
    now,
  }: {
    tokenHash: string;
    now: Date;
  }): Promise<UserId | null> {
    const token: PasswordResetToken | null =
      await this.txHost.tx.passwordResetToken.findFirst({
        where: { tokenHash, expiresAt: { gt: now } },
      });
    return token ? UserIdSchema.parse(token.userId) : null;
  }

  async consumeToken({
    tokenHash,
    now,
  }: {
    tokenHash: string;
    now: Date;
  }): Promise<UserId | null> {
    const userId: UserId | null = await this.findTokenUser({ tokenHash, now });
    if (!userId) return null;
    const result: Prisma.BatchPayload =
      await this.txHost.tx.passwordResetToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: now } },
      });
    return result.count === 1 ? userId : null;
  }
}
