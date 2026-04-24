import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleClientProvider } from './providers/google-client.provider';

@Module({
  imports: [UserModule, JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService, GoogleClientProvider],
})
export class AuthModule {}
