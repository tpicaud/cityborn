import { Global, Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './repositories/email-verification-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './repositories/password-reset-token.repository';
import { PrismaEmailVerificationTokenRepository } from './repositories/prisma-email-verification-token.repository';
import { PrismaPasswordResetTokenRepository } from './repositories/prisma-password-reset-token.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [PrismaClsModule],
  providers: [
    UserService,
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
