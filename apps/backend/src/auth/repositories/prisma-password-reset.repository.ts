import { type UserId, UserIdSchema } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { AuthVersion } from '../../common/types/auth-session';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import type { PasswordResetRepository } from './password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async replaceToken({
    userId,
    authVersion,
    tokenHash,
    expiresAt,
  }: {
    userId: UserId;
    authVersion: AuthVersion;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const tokens: { userId: string }[] = await this.txHost.tx.$queryRaw`
      WITH locked_user AS (
        SELECT id FROM "User"
        WHERE id = ${userId}::uuid AND "authVersion" = ${authVersion}
        FOR UPDATE
      )
      INSERT INTO "PasswordResetToken" ("userId", "tokenHash", "expiresAt")
      SELECT id, ${tokenHash}, ${expiresAt} FROM locked_user
      ON CONFLICT ("userId") DO UPDATE
      SET "tokenHash" = EXCLUDED."tokenHash", "expiresAt" = EXCLUDED."expiresAt"
      RETURNING "userId"
    `;
    return tokens.length === 1;
  }

  async consumeToken({
    tokenHash,
    now,
  }: {
    tokenHash: string;
    now: Date;
  }): Promise<UserId | null> {
    const tokens: { userId: string }[] = await this.txHost.tx.$queryRaw`
      WITH locked_user AS (
        SELECT "User".id FROM "User"
        JOIN "PasswordResetToken" ON "PasswordResetToken"."userId" = "User".id
        WHERE "PasswordResetToken"."tokenHash" = ${tokenHash}
          AND "PasswordResetToken"."expiresAt" > ${now}
        FOR UPDATE OF "User"
      )
      DELETE FROM "PasswordResetToken"
      USING locked_user
      WHERE "PasswordResetToken"."userId" = locked_user.id
        AND "PasswordResetToken"."tokenHash" = ${tokenHash}
        AND "PasswordResetToken"."expiresAt" > ${now}
      RETURNING "PasswordResetToken"."userId"
    `;
    const token: { userId: string } | undefined = tokens[0];
    return token ? UserIdSchema.parse(token.userId) : null;
  }
}
