import {
  buildUser,
  contract,
  ErrorCode,
  type User,
  type UserId,
} from '@cityborn/api';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type {
  AuthenticationContext,
  SessionVersion,
} from '../../src/common/types/authentication';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SessionGateway } from '../../src/session/session.gateway';
import { UserService } from '../../src/user/user.service';
import { AuthenticatedSocketService } from '../../src/ws-handshake/authenticated-socket.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

interface Signal {
  promise: Promise<void>;
  resolve(): void;
}

function createSignal(): Signal {
  let resolveSignal: () => void = () => undefined;
  const promise: Promise<void> = new Promise((resolve) => {
    resolveSignal = resolve;
  });
  return { promise, resolve: resolveSignal };
}

function nextEvent(client: Socket, event: string): Promise<unknown> {
  return new Promise((resolve) => client.once(event, resolve));
}

async function createHistoricalRefreshToken(
  app: NestExpressApplication,
  userId: UserId,
): Promise<string> {
  const jwtService: JwtService = app.get(JwtService);
  const authConfig: AuthConfig = app.get(AUTH_CONFIG);
  return await jwtService.signAsync(
    { id: userId },
    { secret: authConfig.jwtRefreshSecret, expiresIn: '7d' },
  );
}

describe('Authenticated session revocation', () => {
  let app: NestExpressApplication;
  let appUrl: string;
  const clients: Socket[] = [];

  async function connectClient(accessToken?: string): Promise<Socket> {
    const client: Socket = io(appUrl, {
      transports: ['websocket'],
      auth: accessToken ? { access_token: accessToken } : {},
    });
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      client.once('connect', resolve);
      client.once('connect_error', reject);
    });
    return client;
  }

  async function disconnectClient(client: Socket): Promise<void> {
    const socketId: string | undefined = client.id;
    client.disconnect();
    if (!socketId) return;

    const sessionGateway: SessionGateway = app.get(SessionGateway);
    for (let attempt: number = 0; attempt < 100; attempt += 1) {
      const connected: boolean =
        sessionGateway.io.sockets.sockets.has(socketId);
      if (!connected) return;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    throw new Error(`Socket ${socketId} did not disconnect cleanly`);
  }

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    appUrl = await app.getUrl();
  });

  afterEach(async () => {
    for (const client of clients) await disconnectClient(client);
    clients.length = 0;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('accepts historical access and refresh tokens as session version zero', async () => {
    const user: User = buildUser();
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
        isVerified: user.isVerified,
      },
    });
    const accessToken: string = await createAccessToken(app, user.id);
    const refreshToken: string = await createHistoricalRefreshToken(
      app,
      user.id,
    );

    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${refreshToken}`)
      .send({})
      .expect(200);
    const client: Socket = await connectClient(accessToken);

    expect(client.connected).toBe(true);
  });

  it('rejects stale HTTP and WebSocket sessions without affecting guests or other users', async () => {
    const user: User = buildUser();
    const otherUser: User = buildUser({
      id: '00000000-0000-4000-8000-000000000002',
      email: 'other@cityborn.test',
      username: 'other',
    });
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.createMany({
      data: [
        {
          id: user.id,
          email: user.email,
          username: user.username,
          type: user.type,
          isVerified: user.isVerified,
        },
        {
          id: otherUser.id,
          email: otherUser.email,
          username: otherUser.username,
          type: otherUser.type,
          isVerified: otherUser.isVerified,
        },
      ],
    });
    const accessToken: string = await createAccessToken(app, user.id);
    const refreshToken: string = await createHistoricalRefreshToken(
      app,
      user.id,
    );
    const otherAccessToken: string = await createAccessToken(app, otherUser.id);
    const authenticatedClient: Socket = await connectClient(accessToken);
    const guestClient: Socket = await connectClient();
    const otherClient: Socket = await connectClient(otherAccessToken);
    const disconnected: Promise<unknown> = nextEvent(
      authenticatedClient,
      'disconnect',
    );
    const userService: UserService = app.get(UserService);
    const authenticatedSocketService: AuthenticatedSocketService = app.get(
      AuthenticatedSocketService,
    );

    const sessionVersion: SessionVersion =
      await userService.incrementSessionVersion(user.id);
    await authenticatedSocketService.disconnectOlderSessions(
      user.id,
      sessionVersion,
    );

    expect(sessionVersion).toBe(1);
    await expect(disconnected).resolves.toBe('io server disconnect');
    expect(guestClient.connected).toBe(true);
    expect(otherClient.connected).toBe(true);
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401)
      .expect(({ body }: request.Response) => {
        expect(body).toMatchObject({ code: ErrorCode.USER_INVALID_TOKEN });
      });
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${refreshToken}`)
      .send({})
      .expect(401)
      .expect(({ body }: request.Response) => {
        expect(body).toMatchObject({ code: ErrorCode.USER_INVALID_TOKEN });
      });
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(200);

    const staleClient: Socket = io(appUrl, {
      transports: ['websocket'],
      auth: { access_token: accessToken },
    });
    clients.push(staleClient);
    const connectError: unknown = await nextEvent(staleClient, 'connect_error');

    expect(connectError).toMatchObject({
      data: { statusCode: 401, code: ErrorCode.USER_INVALID_TOKEN },
    });
    expect(staleClient.connected).toBe(false);
    expect(guestClient.connected).toBe(true);
    expect(otherClient.connected).toBe(true);
  });

  it('disconnects a session revoked while its socket is completing authentication', async () => {
    const user: User = buildUser();
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
        isVerified: user.isVerified,
      },
    });
    const accessToken: string = await createAccessToken(app, user.id);
    const initialLookupCompleted: Signal = createSignal();
    const releaseInitialLookup: Signal = createSignal();
    const userService: UserService = app.get(UserService);
    const originalFindAuthenticationContextById: UserService['findAuthenticationContextById'] =
      userService.findAuthenticationContextById.bind(userService);
    let delayInitialLookup: boolean = true;
    const findAuthenticationContextById: jest.SpiedFunction<
      UserService['findAuthenticationContextById']
    > = jest
      .spyOn(userService, 'findAuthenticationContextById')
      .mockImplementation(
        async (userId: UserId): Promise<AuthenticationContext | null> => {
          const authentication: AuthenticationContext | null =
            await originalFindAuthenticationContextById(userId);
          if (!delayInitialLookup) return authentication;

          delayInitialLookup = false;
          initialLookupCompleted.resolve();
          await releaseInitialLookup.promise;
          return authentication;
        },
      );
    const client: Socket = io(appUrl, {
      transports: ['websocket'],
      auth: { access_token: accessToken },
    });
    clients.push(client);
    const disconnected: Promise<unknown> = nextEvent(client, 'disconnect');
    const authenticatedSocketService: AuthenticatedSocketService = app.get(
      AuthenticatedSocketService,
    );

    try {
      await initialLookupCompleted.promise;
      const sessionVersion: SessionVersion =
        await userService.incrementSessionVersion(user.id);
      await authenticatedSocketService.disconnectOlderSessions(
        user.id,
        sessionVersion,
      );
      releaseInitialLookup.resolve();

      expect(sessionVersion).toBe(1);
      await expect(disconnected).resolves.toBe('io server disconnect');
      expect(client.connected).toBe(false);
      expect(findAuthenticationContextById).toHaveBeenCalledTimes(2);
    } finally {
      releaseInitialLookup.resolve();
      findAuthenticationContextById.mockRestore();
    }
  });
});
