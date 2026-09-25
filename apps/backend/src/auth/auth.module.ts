import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleClientProvider } from './providers/google-client.provider';
import { PASSWORD_RESET_REPOSITORY } from './repositories/password-reset.repository';
import { PrismaPasswordResetRepository } from './repositories/prisma-password-reset.repository';
import { PasswordResetService } from './services/password-reset.service';
import { SessionRevocationService } from './services/session-revocation.service';

@Module({
  imports: [
    PrismaClsModule,
    RateLimitModule,
    UserModule,
    MailModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  exports: [SessionRevocationService],
  providers: [
    AuthService,
    GoogleClientProvider,
    PasswordResetService,
    SessionRevocationService,
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PrismaPasswordResetRepository,
    },
  ],
})
export class AuthModule {}
