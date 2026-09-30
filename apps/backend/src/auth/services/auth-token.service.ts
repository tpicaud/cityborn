import {
  type AuthResponse,
  ErrorCode,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import {
  type AuthSession,
  AuthVersionSchema,
} from '../../common/types/auth-session';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';

const ACCESS_TOKEN_TTL_SECONDS: number = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS: number = 7 * 24 * 60 * 60;

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  authVersion: AuthVersionSchema.optional().default(0),
});

export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

export type AuthTokenPair = Pick<
  AuthResponse,
  'access_token' | 'refresh_token'
>;

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
  ) {}

  async issueTokenPair(authSession: AuthSession): Promise<AuthTokenPair> {
    const { user, authVersion } = authSession;
    const payload = {
      id: UserIdSchema.parse(user.id),
      username: UsernameSchema.parse(user.username),
      email: user.email,
      authVersion,
    };
    const [accessToken, refreshToken]: [string, string] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.authConfig.jwtAccessSecret,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.authConfig.jwtRefreshSecret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthTokenPayload> {
    return await this.verifyToken(accessToken, this.authConfig.jwtAccessSecret);
  }

  async verifyRefreshToken(refreshToken: string): Promise<AuthTokenPayload> {
    return await this.verifyToken(
      refreshToken,
      this.authConfig.jwtRefreshSecret,
    );
  }

  async resolveAuthSession(
    payload: AuthTokenPayload,
  ): Promise<AuthSession | null> {
    const authSession: AuthSession | null =
      await this.userService.findAuthSessionById(payload.id);
    if (!authSession) return null;
    if (authSession.authVersion === payload.authVersion) {
      return authSession;
    }

    throw new UnauthorizedException({
      code: ErrorCode.USER_INVALID_TOKEN,
      message: 'Session revoked',
    });
  }

  private async verifyToken(
    token: string,
    secret: string | undefined,
  ): Promise<AuthTokenPayload> {
    const payload: unknown = await this.jwtService.verifyAsync(token, {
      secret,
    });
    return AuthTokenPayloadSchema.parse(payload);
  }
}
