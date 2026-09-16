import { UserIdSchema } from '@cityborn/api';
import type { EmailVerificationToken as PrismaEmailVerificationToken } from '@prisma/client';
import type { EmailVerificationToken } from '../repositories/email-verification-token.repository';

export const EmailVerificationTokenMapper = {
  toVerificationToken(
    prismaToken: PrismaEmailVerificationToken,
  ): EmailVerificationToken {
    return {
      id: prismaToken.id,
      userId: UserIdSchema.parse(prismaToken.userId),
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
    };
  },
};
