import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { WsHandshakeModule } from '../ws-handshake/ws-handshake.module';
import { AuthController } from './controllers/auth.controller';
import { AuthCookieController } from './controllers/auth-cookie.controller';
import { GoogleClientProvider } from './google-client.provider';
import { AuthService } from './services/auth.service';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthTokenService } from './services/auth-token.service';

@Global()
@Module({
  imports: [
    UserModule,
    MailModule,
    WsHandshakeModule,
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController, AuthCookieController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthCookieService,
    GoogleClientProvider,
  ],
  exports: [AuthTokenService, AuthCookieService],
})
export class AuthModule {}
