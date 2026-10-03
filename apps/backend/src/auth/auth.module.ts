import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { UserModule } from '../user/user.module';
import { WsHandshakeModule } from '../ws-handshake/ws-handshake.module';
import { AuthController } from './controllers/auth.controller';
import { AuthCookieController } from './controllers/auth-cookie.controller';
import { GoogleClientProvider } from './identity-providers/google-client.provider';
import { IdentityTokenService } from './identity-providers/identity-token.service';
import { AuthService } from './services/auth.service';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthTokenService } from './services/auth-token.service';

@Global()
@Module({
  imports: [
    UserModule,
    MailModule,
    RateLimitModule,
    WsHandshakeModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController, AuthCookieController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthCookieService,
    IdentityTokenService,
    GoogleClientProvider,
  ],
  exports: [AuthTokenService, AuthCookieService],
})
export class AuthModule {}
