import type { UserId } from '@cityborn/api';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';

export async function createAccessToken(
  app: NestExpressApplication,
  userId: UserId,
): Promise<string> {
  const jwtService: JwtService = app.get(JwtService);
  const authConfig: AuthConfig = app.get(AUTH_CONFIG);

  return await jwtService.signAsync(
    { id: userId },
    { secret: authConfig.jwtAccessSecret, expiresIn: '15m' },
  );
}
