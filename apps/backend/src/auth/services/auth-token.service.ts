import { createHash, randomUUID } from 'node:crypto';
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
import { RedisService } from '../../redis/redis.service';
import { UserService } from '../../user/user.service';

const ACCESS_TOKEN_TTL_SECONDS: number = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS: number = 7 * 24 * 60 * 60;

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  authVersion: AuthVersionSchema.optional().default(0),
});

export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

const RefreshTokenPayloadSchema = AuthTokenPayloadSchema.extend({
  exp: z.number().int(),
});

type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

const CONSUMED_REFRESH_TOKEN_KEY_PREFIX: string =
  'auth:consumed-refresh-token:';

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
    private readonly redisService: RedisService,
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
        jwtid: randomUUID(),
      }),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthTokenPayload> {
    const payload: unknown = await this.jwtService.verifyAsync(accessToken, {
      secret: this.authConfig.jwtAccessSecret,
    });
    return AuthTokenPayloadSchema.parse(payload);
  }

  async redeemRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const payload: RefreshTokenPayload =
      await this.verifyRefreshToken(refreshToken);
    const authSession: AuthSession | null =
      await this.resolveAuthSession(payload);
    if (!authSession) return null;

    const consumed: boolean = await this.consumeRefreshToken({
      refreshToken,
      payload,
    });
    if (!consumed) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Refresh token already used or revoked',
      });
    }
    return authSession;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const payload: RefreshTokenPayload | null = await this.verifyRefreshToken(
      refreshToken,
    ).catch(() => null);
    if (!payload) return;

    await this.consumeRefreshToken({ refreshToken, payload });
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

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    const payload: unknown = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.authConfig.jwtRefreshSecret,
    });
    return RefreshTokenPayloadSchema.parse(payload);
  }

  private async consumeRefreshToken({
    refreshToken,
    payload,
  }: {
    refreshToken: string;
    payload: RefreshTokenPayload;
  }): Promise<boolean> {
    const refreshTokenHash: string = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const remainingLifetimeSeconds: number = Math.max(
      payload.exp - Math.floor(Date.now() / 1000),
      1,
    );
    return await this.redisService.setIfAbsent({
      key: `${CONSUMED_REFRESH_TOKEN_KEY_PREFIX}${refreshTokenHash}`,
      value: '1',
      ttlSeconds: remainingLifetimeSeconds,
    });
  }
}
