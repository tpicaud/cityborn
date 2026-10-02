import { AsyncLocalStorage } from 'node:async_hooks';
import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { JwtService } from '@nestjs/jwt';
import { JsonWebTokenError } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { AuthCookieService } from '../auth/services/auth-cookie.service';
import { AuthTokenService } from '../auth/services/auth-token.service';
import type { AppSocket } from '../common/types/app-socket';
import type { WideEventLogger } from '../common/wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import type { AuthConfig, RuntimeConfig } from '../config/config.module';
import type { RateLimitService } from '../rate-limit/rate-limit.service';
import type { RedisService } from '../redis/redis.service';
import type { UserService } from '../user/user.service';
import { AuthenticatedSocketService } from './authenticated-socket.service';
import {
  WsHandshakeError,
  WsHandshakeMiddleware,
} from './ws-handshake.middleware';

interface HandshakeInput {
  query?: Record<string, string | string[]>;
  cookie?: string;
  auth?: Record<string, unknown>;
}

function buildSocket({
  query = {},
  cookie,
  auth = {},
}: HandshakeInput = {}): AppSocket {
  return createMock<AppSocket>({
    id: 'socket-1',
    handshake: {
      headers: cookie ? { cookie } : {},
      address: '203.0.113.7',
      query,
      auth,
    },
    data: {},
  });
}

function buildMiddleware() {
  const logger: DeepMocked<WideEventLogger> = createMock<WideEventLogger>();
  const wideEventService: WideEventService = new WideEventService(
    new ClsService<WideEventClsStore>(new AsyncLocalStorage()),
    logger,
  );
  const rateLimitService: DeepMocked<RateLimitService> =
    createMock<RateLimitService>();
  const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const authConfig: AuthConfig = createMock<AuthConfig>({
    jwtAccessSecret: 'access-secret',
  });
  const runtimeConfig: RuntimeConfig = {
    nodeEnvironment: 'test',
    port: 4000,
  };
  const wsHandshakeMiddleware: WsHandshakeMiddleware =
    new WsHandshakeMiddleware(
      new AuthTokenService(
        jwtService,
        authConfig,
        userService,
        createMock<RedisService>(),
      ),
      new AuthCookieService(runtimeConfig),
      new AuthenticatedSocketService(),
      rateLimitService,
      wideEventService,
      new WsWideEventLifecycle(wideEventService),
    );

  return {
    logger,
    rateLimitService,
    jwtService,
    userService,
    wsHandshakeMiddleware,
  };
}

function runHandshake(
  wsHandshakeMiddleware: WsHandshakeMiddleware,
  socket: AppSocket,
): Promise<WsHandshakeError | undefined> {
  return new Promise((resolve) =>
    wsHandshakeMiddleware.use(socket, (error) => resolve(error)),
  );
}

describe('WsHandshakeMiddleware', () => {
  describe('use', () => {
    it('rejects a rate limited handshake with a typed error and records the refused connection', async () => {
      const {
        logger,
        rateLimitService,
        jwtService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      rateLimitService.consumeWsConnection.mockRejectedValue(
        new RateLimiterRes(),
      );
      const socket: AppSocket = buildSocket({
        auth: { access_token: 'access-token' },
      });

      const error: WsHandshakeError | undefined = await runHandshake(
        wsHandshakeMiddleware,
        socket,
      );

      expect(error).toBeInstanceOf(WsHandshakeError);
      expect(error?.data).toEqual({
        statusCode: 429,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
      });
      expect(rateLimitService.consumeWsConnection).toHaveBeenCalledWith(
        '203.0.113.7',
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ws_connection',
          domain: 'infrastructure',
          eventName: 'connect',
          socketId: 'socket-1',
          statusCode: 429,
          errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
          isAuthenticated: false,
        }),
        'connection',
      );
    });

    it('accepts a handshake without token as anonymous', async () => {
      const {
        jwtService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      const socket: AppSocket = buildSocket();

      const error: WsHandshakeError | undefined = await runHandshake(
        wsHandshakeMiddleware,
        socket,
      );

      expect(error).toBeUndefined();
      expect(socket.data).toEqual({
        authSession: null,
        visitorId: undefined,
      });
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('authenticates the handshake from the auth access token', async () => {
      const {
        logger,
        jwtService,
        userService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      const user: User = buildUser();
      jwtService.verifyAsync.mockResolvedValue({ id: user.id });
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 0,
      });
      const socket: AppSocket = buildSocket({
        cookie: 'theme=dark',
        auth: { access_token: 'access-token' },
      });

      const error: WsHandshakeError | undefined = await runHandshake(
        wsHandshakeMiddleware,
        socket,
      );

      expect(error).toBeUndefined();
      expect(socket.data.authSession).toEqual({ user, authVersion: 0 });
      expect(socket.join).toHaveBeenCalledWith([
        `auth:user:${user.id}`,
        `auth:user:${user.id}:version:0`,
      ]);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token', {
        secret: 'access-secret',
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ws_connection',
          isAuthenticated: true,
          userId: user.id,
        }),
        'connection',
      );
    });

    it('prefers the access token cookie over the auth access token', async () => {
      const {
        jwtService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      const socket: AppSocket = buildSocket({
        cookie: 'access_token=cookie-token',
        auth: { access_token: 'auth-token' },
      });

      await runHandshake(wsHandshakeMiddleware, socket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-token', {
        secret: 'access-secret',
      });
    });

    it('accepts a handshake with an invalid token as anonymous and records the token error', async () => {
      const {
        logger,
        jwtService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      jwtService.verifyAsync.mockRejectedValue(
        new JsonWebTokenError('invalid signature'),
      );
      const socket: AppSocket = buildSocket({
        auth: { access_token: 'invalid-token' },
      });

      const error: WsHandshakeError | undefined = await runHandshake(
        wsHandshakeMiddleware,
        socket,
      );

      expect(error).toBeUndefined();
      expect(socket.data.authSession).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ws_connection',
          statusCode: 401,
          errorCode: ErrorCode.USER_INVALID_TOKEN,
          isAuthenticated: false,
        }),
        'connection',
      );
    });

    it('rejects a stale session without joining its rooms', async () => {
      const {
        jwtService,
        userService,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      const user: User = buildUser();
      jwtService.verifyAsync.mockResolvedValue({
        id: user.id,
        authVersion: 1,
      });
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 2,
      });
      const socket: AppSocket = buildSocket({
        auth: { access_token: 'stale-token' },
      });

      const error: WsHandshakeError | undefined = await runHandshake(
        wsHandshakeMiddleware,
        socket,
      );

      expect(error?.data).toMatchObject({
        statusCode: 401,
        code: ErrorCode.USER_INVALID_TOKEN,
      });
      expect(socket.data.authSession).toBeNull();
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('keeps the first visitor id of the handshake query', async () => {
      const {
        logger,
        wsHandshakeMiddleware,
      }: ReturnType<typeof buildMiddleware> = buildMiddleware();
      const socket: AppSocket = buildSocket({
        query: { 'x-visitor-id': ['visitor-1', 'visitor-2'] },
      });

      await runHandshake(wsHandshakeMiddleware, socket);

      expect(socket.data.visitorId).toBe('visitor-1');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ visitorId: 'visitor-1' }),
        'connection',
      );
    });

    it('ignores an empty visitor id', async () => {
      const { wsHandshakeMiddleware }: ReturnType<typeof buildMiddleware> =
        buildMiddleware();
      const socket: AppSocket = buildSocket({
        query: { 'x-visitor-id': '' },
      });

      await runHandshake(wsHandshakeMiddleware, socket);

      expect(socket.data.visitorId).toBeUndefined();
    });
  });
});
