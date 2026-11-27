import { AsyncLocalStorage } from 'node:async_hooks';
import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import type { AuthSession } from '../../common/types/auth-session';
import type {
  HttpWideEventInit,
  WideEventLogger,
} from '../../common/wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../../common/wide-event/wide-event.service';
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
    createMock<WideEventService>(),
  );
  return { authTokenService, jwtService, userService, redisService };
}

const httpWideEventInit: HttpWideEventInit = {
  transport: 'http',
  requestId: 'request-1',
  domain: 'auth',
  operation: 'GET /auth/me',
  method: 'GET',
  route: '/auth/me',
  ip: '127.0.0.1',
  userAgent: undefined,
  visitorId: undefined,
  client: undefined,
  clientVersion: undefined,
  apiVersion: 1,
  isAuthenticated: false,
};

type TokenRejection = {
  error: unknown;
  wideEvent: object;
};

function buildTokenRejectionScenario() {
  const jwtService: JwtService = new JwtService();
  const logger: DeepMocked<WideEventLogger> = createMock<WideEventLogger>();
  const wideEventService: WideEventService = new WideEventService(
    new ClsService<WideEventClsStore>(new AsyncLocalStorage()),
    logger,
  );
  const authConfig: AuthConfig = createMock<AuthConfig>({
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
  });
  const authTokenService: AuthTokenService = new AuthTokenService(
    jwtService,
    authConfig,
    createMock<UserService>(),
    createMock<RedisService>(),
    wideEventService,
  );

  async function rejectInsideWideEvent(
    verification: (service: AuthTokenService) => Promise<unknown>,
  ): Promise<TokenRejection> {
    const error: unknown = await wideEventService.run(
      httpWideEventInit,
      async () => {
        const rejection: unknown = await verification(authTokenService).then(
          () => undefined,
          (verificationError: unknown) => verificationError,
        );
        wideEventService.finish({ statusCode: 401 });
        return rejection;
      },
    );
    const [[wideEvent]]: Parameters<WideEventLogger['warn']>[] =
      logger.warn.mock.calls;
    return { error, wideEvent };
  }

  return { jwtService, rejectInsideWideEvent };
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
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

    it('records the rejection reason and the unverified claims of a token signed with another secret', async () => {
      const user: User = buildUser();
      const {
        jwtService,
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();
      const issuedAt: number = nowInSeconds() - 60;
      const accessToken: string = await jwtService.signAsync(
        { id: user.id, iat: issuedAt },
        { secret: 'other-secret', expiresIn: 900 },
      );

      const { error, wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.verifyAccessToken(accessToken),
      );

      expect(error).toBeInstanceOf(JsonWebTokenError);
      expect(wideEvent).toMatchObject({
        tokenRejectionReason: 'invalid signature',
        rejectedTokenUserId: user.id,
        rejectedTokenIat: issuedAt,
        rejectedTokenExp: issuedAt + 900,
        isAuthenticated: false,
      });
      expect(wideEvent).not.toHaveProperty('userId');
    });

    it('keeps the token and its signature out of the wide event', async () => {
      const user: User = buildUser();
      const {
        jwtService,
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();
      const accessToken: string = await jwtService.signAsync(
        { id: user.id },
        { secret: 'other-secret', expiresIn: 900 },
      );
      const [, , signature]: string[] = accessToken.split('.');

      const { wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.verifyAccessToken(accessToken),
      );

      const serializedWideEvent: string = JSON.stringify(wideEvent);
      expect(serializedWideEvent).not.toContain(accessToken);
      expect(serializedWideEvent).not.toContain(signature);
    });

    it('records a malformed token without claims', async () => {
      const {
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();

      const { wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.verifyAccessToken('not-a-jwt'),
      );

      expect(wideEvent).toMatchObject({
        tokenRejectionReason: 'jwt malformed',
      });
      expect(wideEvent).not.toHaveProperty('rejectedTokenUserId');
      expect(wideEvent).not.toHaveProperty('rejectedTokenIat');
      expect(wideEvent).not.toHaveProperty('rejectedTokenExp');
    });

    it('records a token whose payload is not an object without claims', async () => {
      const {
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();
      const header: string = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payload: string = Buffer.from(JSON.stringify(['x'])).toString(
        'base64url',
      );
      const accessToken: string = `${header}.${payload}.signature`;

      const { error, wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.verifyAccessToken(accessToken),
      );

      expect(error).toBeInstanceOf(JsonWebTokenError);
      expect(wideEvent).toMatchObject({
        tokenRejectionReason: 'invalid signature',
      });
      expect(wideEvent).not.toHaveProperty('rejectedTokenUserId');
    });

    it('records the expiry of an expired token', async () => {
      const user: User = buildUser();
      const {
        jwtService,
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();
      const issuedAt: number = nowInSeconds() - 3600;
      const accessToken: string = await jwtService.signAsync(
        { id: user.id, iat: issuedAt },
        { secret: 'access-secret', expiresIn: 900 },
      );

      const { wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.verifyAccessToken(accessToken),
      );

      expect(wideEvent).toMatchObject({
        tokenRejectionReason: 'jwt expired',
        rejectedTokenUserId: user.id,
        rejectedTokenExp: issuedAt + 900,
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

    it('records the rejection reason of a refresh token signed with another secret', async () => {
      const user: User = buildUser();
      const {
        jwtService,
        rejectInsideWideEvent,
      }: ReturnType<typeof buildTokenRejectionScenario> =
        buildTokenRejectionScenario();
      const refreshToken: string = await jwtService.signAsync(
        { id: user.id },
        { secret: 'access-secret', expiresIn: 900 },
      );

      const { wideEvent }: TokenRejection = await rejectInsideWideEvent(
        (service: AuthTokenService) => service.redeemRefreshToken(refreshToken),
      );

      expect(wideEvent).toMatchObject({
        tokenRejectionReason: 'invalid signature',
        rejectedTokenUserId: user.id,
      });
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
