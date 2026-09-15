import { Global, Module } from '@nestjs/common';
import { GameRecordModule } from '../game-record/game-record.module';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from './repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [PrismaClsModule, GameRecordModule],
  providers: [
    UserService,
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository,
    },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
