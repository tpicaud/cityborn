import { UserIdSchema } from '@cityborn/api';
import type { PasswordResetToken as PrismaPasswordResetToken } from '@prisma/client';
import type { PasswordResetToken } from '../repositories/password-reset-token.repository';

export const PasswordResetTokenMapper = {
  toPasswordResetToken(
    prismaToken: PrismaPasswordResetToken,
  ): PasswordResetToken {
    return {
      id: prismaToken.id,
      userId: UserIdSchema.parse(prismaToken.userId),
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
    };
  },
};
