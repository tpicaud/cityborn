import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { JwtService } from '@nestjs/jwt';
import { JsonWebTokenError } from '@nestjs/jwt';
import type { AuthSession } from '../../common/types/auth-session';
import type { AuthConfig } from '../../config/config.module';
import type { RedisService } from '../../redis/redis.service';
import type { UserService } from '../../user/user.service';
import { type AuthTokenPayload, AuthTokenService } from './auth-token.service';

function buildAuthTokenService() {
  const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const redisService: DeepMocked<RedisService> = createMock<RedisService>();
  const authConfig: AuthConfig = createMock<AuthConfig>({
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
  });
  const authTokenService: AuthTokenService = new AuthTokenService(
    jwtService,
    authConfig,
    userService,
    redisService,
  );
  return { authTokenService, jwtService, userService, redisService };
}

describe('AuthTokenService', () => {
  describe('verifyAccessToken', () => {
    it('treats a historical token without a version as version zero', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        jwtService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      jwtService.verifyAsync.mockResolvedValue({ id: user.id });

      const payload: AuthTokenPayload =
        await authTokenService.verifyAccessToken('historical-token');

      expect(payload).toEqual({ id: user.id, authVersion: 0 });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('historical-token', {
        secret: 'access-secret',
      });
    });
  });

  describe('resolveAuthSession', () => {
    it('rejects a token whose version differs from persisted state', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        userService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 2,
      });

      await expect(
        authTokenService.resolveAuthSession({ id: user.id, authVersion: 1 }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    });
  });

  describe('redeemRefreshToken', () => {
    it('consumes the refresh token until it expires', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        jwtService,
        userService,
        redisService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      const expiresAt: number = Math.floor(Date.now() / 1000) + 600;
      jwtService.verifyAsync.mockResolvedValue({
        id: user.id,
        authVersion: 0,
        exp: expiresAt,
      });
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 0,
      });
      redisService.setIfAbsent.mockResolvedValue(true);

      const authSession: AuthSession | null =
        await authTokenService.redeemRefreshToken('refresh-token');

      expect(authSession).toEqual({ user, authVersion: 0 });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'refresh-secret',
      });
      expect(redisService.setIfAbsent).toHaveBeenCalledWith({
        key: 'auth:consumed-refresh-token:0eb17643d4e9261163783a420859c92c7d212fa9624106a12b510afbec266120',
        value: '1',
        ttlSeconds: expect.any(Number),
      });
      const [{ ttlSeconds }]: Parameters<RedisService['setIfAbsent']> =
        redisService.setIfAbsent.mock.calls[0];
      expect(ttlSeconds).toBeGreaterThan(595);
      expect(ttlSeconds).toBeLessThanOrEqual(600);
    });

    it('rejects a refresh token already used or revoked', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        jwtService,
        userService,
        redisService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      jwtService.verifyAsync.mockResolvedValue({
        id: user.id,
        authVersion: 0,
        exp: Math.floor(Date.now() / 1000) + 600,
      });
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 0,
      });
      redisService.setIfAbsent.mockResolvedValue(false);

      await expect(
        authTokenService.redeemRefreshToken('refresh-token'),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    });
  });

  describe('revokeRefreshToken', () => {
    it('ignores a refresh token that does not verify', async () => {
      const {
        authTokenService,
        jwtService,
        redisService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      jwtService.verifyAsync.mockRejectedValue(
        new JsonWebTokenError('invalid signature'),
      );

      await authTokenService.revokeRefreshToken('forged-token');

      expect(redisService.setIfAbsent).not.toHaveBeenCalled();
    });
  });
});
