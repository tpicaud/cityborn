import type { UserId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PasswordResetToken as PrismaPasswordResetToken } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';
import type {
  CreatePasswordResetToken,
  PasswordResetToken,
  PasswordResetTokenRepository,
} from './password-reset-token.repository';

@Injectable()
export class PrismaPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const token: PrismaPasswordResetToken | null =
      await this.txHost.tx.passwordResetToken.findUnique({
        where: { tokenHash },
      });
    return token ? PasswordResetTokenMapper.toPasswordResetToken(token) : null;
  }

  async create(data: CreatePasswordResetToken): Promise<void> {
    await this.txHost.tx.passwordResetToken.create({
      data: {
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }

  async consumeUnexpired({
    tokenHash,
    now,
  }: {
    tokenHash: string;
    now: Date;
  }): Promise<boolean> {
    const { count }: { count: number } =
      await this.txHost.tx.passwordResetToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: now } },
      });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.txHost.tx.passwordResetToken.delete({ where: { id } });
  }

  async deleteByUserId(userId: UserId): Promise<void> {
    await this.txHost.tx.passwordResetToken.deleteMany({ where: { userId } });
  }
}
