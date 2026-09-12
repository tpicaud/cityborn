import type { UserId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { EmailVerificationTokenMapper } from '../mappers/email-verification-token.mapper';
import type {
  CreateEmailVerificationToken,
  EmailVerificationToken,
  EmailVerificationTokenRepository,
} from './email-verification-token.repository';

@Injectable()
export class PrismaEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findLatestVerificationToken(
    userId: UserId,
  ): Promise<EmailVerificationToken | null> {
    const existingToken = await this.txHost.tx.emailVerificationToken.findFirst(
      {
        where: { userId },
        orderBy: { createdAt: 'desc' },
      },
    );
    return existingToken
      ? EmailVerificationTokenMapper.toVerificationToken(existingToken)
      : null;
  }

  async findVerificationToken(
    verificationToken: string,
  ): Promise<EmailVerificationToken | null> {
    const token = await this.txHost.tx.emailVerificationToken.findUnique({
      where: { token: verificationToken },
    });
    return token
      ? EmailVerificationTokenMapper.toVerificationToken(token)
      : null;
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
}
