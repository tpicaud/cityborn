import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { UserModule } from '../user/user.module';
import { WsHandshakeModule } from '../ws-handshake/ws-handshake.module';
import { AuthController } from './controllers/auth.controller';
import { AuthCookieController } from './controllers/auth-cookie.controller';
import { GoogleClientProvider } from './identity-providers/google-client.provider';
import { IdentityTokenService } from './identity-providers/identity-token.service';
import { PASSWORD_RESET_REPOSITORY } from './repositories/password-reset.repository';
import { PrismaPasswordResetRepository } from './repositories/prisma-password-reset.repository';
import { AuthService } from './services/auth.service';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthTokenService } from './services/auth-token.service';
import { PasswordResetService } from './services/password-reset.service';

@Global()
@Module({
  imports: [
    PrismaClsModule,
    RateLimitModule,
    UserModule,
    MailModule,
    WsHandshakeModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController, AuthCookieController],
  providers: [
    PasswordResetService,
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PrismaPasswordResetRepository,
    },
    AuthService,
    AuthTokenService,
    AuthCookieService,
    IdentityTokenService,
    GoogleClientProvider,
  ],
  exports: [AuthTokenService, AuthCookieService],
})
export class AuthModule {}
