import {
  buildUser,
  contract,
  ErrorCode,
  type User,
  type UserId,
} from '@cityborn/api';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../src/auth/services/auth-cookie.service';
import type { AppSocket } from '../../src/common/types/app-socket';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';
import { SessionGateway } from '../../src/session/session.gateway';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/repositories/user.repository';
import { createTestApp } from '../support/createTestApp';

const allowedOrigin: string = 'http://localhost:3000';

function nextEvent(client: Socket, event: string): Promise<unknown> {
  return new Promise((resolve) => client.once(event, resolve));
}

function responseCookies(header: string | string[] | undefined): string[] {
  if (header === undefined) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

function cookiePair(cookies: string[], cookieName: string): string {
  const cookie: string | undefined = cookies.find((setCookie: string) =>
    setCookie.startsWith(`${cookieName}=`),
  );
  if (cookie === undefined) {
    throw new Error(`Missing ${cookieName} cookie`);
  }
  return cookie.split(';')[0];
}

describe('WebSocket cookie authentication', () => {
  let app: NestExpressApplication;
  let appUrl: string;
  const clients: Socket[] = [];

  function openCookieClient({
    cookie,
    origin,
  }: {
    cookie: string;
    origin: string;
  }): Socket {
    const client: Socket = io(appUrl, {
      transports: ['websocket'],
      extraHeaders: { cookie, origin },
    });
    clients.push(client);
    return client;
  }

  function serverSocket(client: Socket): AppSocket | undefined {
    const sessionGateway: SessionGateway = app.get(SessionGateway);
    return client.id === undefined
      ? undefined
      : sessionGateway.io.sockets.sockets.get(client.id);
  }

  async function disconnectClient(client: Socket): Promise<void> {
    const socketId: string | undefined = client.id;
    client.disconnect();
    if (!socketId) return;

    await waitForServerDisconnection(socketId, 100);
  }

  async function waitForServerDisconnection(
    socketId: string,
    remainingAttempts: number,
  ): Promise<void> {
    const sessionGateway: SessionGateway = app.get(SessionGateway);
    const connected: boolean = sessionGateway.io.sockets.sockets.has(socketId);
    if (!connected) return;
    if (remainingAttempts === 0) {
      throw new Error(`Socket ${socketId} did not disconnect cleanly`);
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    await waitForServerDisconnection(socketId, remainingAttempts - 1);
  }

  async function persistEmailUser(password: string): Promise<User> {
    const userData: User = buildUser();
    const userRepository: UserRepository = app.get(USER_REPOSITORY);
    return await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: 'email',
      password: await bcrypt.hash(password, 4),
      isVerified: userData.isVerified,
    });
  }

  async function createExpiredAccessToken(userId: UserId): Promise<string> {
    const jwtService: JwtService = app.get(JwtService);
    const authConfig: AuthConfig = app.get(AUTH_CONFIG);
    return await jwtService.signAsync(
      { id: userId, authVersion: 0 },
      { secret: authConfig.jwtAccessSecret, expiresIn: -60 },
    );
  }

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    appUrl = await app.getUrl();
  });

  afterEach(async () => {
    await Promise.all(clients.map(disconnectClient));
    clients.length = 0;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects an expired access cookie then reconnects the same socket after a cookie refresh', async () => {
    const password: string = 'Password1';
    const user: User = await persistEmailUser(password);
    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', allowedOrigin)
      .send({ identifier: user.email, password })
      .expect(200);
    const refreshTokenCookie: string = cookiePair(
      responseCookies(signInResponse.headers['set-cookie']),
      REFRESH_TOKEN_COOKIE_NAME,
    );
    const expiredAccessToken: string = await createExpiredAccessToken(user.id);
    const client: Socket = openCookieClient({
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${expiredAccessToken}`,
      origin: allowedOrigin,
    });

    const connectError: unknown = await nextEvent(client, 'connect_error');

    expect(connectError).toMatchObject({
      data: { statusCode: 401, code: ErrorCode.TOKEN_EXPIRED },
    });
    expect(client.active).toBe(false);

    const refreshResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.refresh.path)
      .set('Origin', allowedOrigin)
      .set('Cookie', refreshTokenCookie)
      .send({})
      .expect(200);
    const refreshedAccessTokenCookie: string = cookiePair(
      responseCookies(refreshResponse.headers['set-cookie']),
      ACCESS_TOKEN_COOKIE_NAME,
    );
    client.io.opts.extraHeaders = {
      cookie: refreshedAccessTokenCookie,
      origin: allowedOrigin,
    };
    const connected: Promise<unknown> = nextEvent(client, 'connect');
    client.connect();
    await connected;

    expect(serverSocket(client)?.data.authSession?.user.id).toBe(user.id);
  });

  it('rejects a cookie-authenticated handshake from an unauthorized origin', async () => {
    const password: string = 'Password1';
    const user: User = await persistEmailUser(password);
    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', allowedOrigin)
      .send({ identifier: user.email, password })
      .expect(200);
    const accessTokenCookie: string = cookiePair(
      responseCookies(signInResponse.headers['set-cookie']),
      ACCESS_TOKEN_COOKIE_NAME,
    );
    const client: Socket = openCookieClient({
      cookie: accessTokenCookie,
      origin: 'https://attacker.test',
    });

    const connectError: unknown = await nextEvent(client, 'connect_error');

    expect(connectError).toMatchObject({
      data: { statusCode: 403, code: ErrorCode.CSRF_ORIGIN_FORBIDDEN },
    });
    expect(client.connected).toBe(false);
  });
});
