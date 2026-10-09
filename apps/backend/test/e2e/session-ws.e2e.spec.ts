import type { PlayerId, Session, SessionJoinAck } from '@cityborn/api';
import {
  buildPlayer,
  buildSession,
  buildUser,
  ErrorCode,
  PlayerIdSchema,
  SessionJoinAckSchema,
  SessionSchema,
  sessionWsEvent,
  sessionWsServerEvent,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from 'socket.io-client';
import { ConnectionRegistryService } from '../../src/connection-registry/connection-registry.service';
import {
  CONNECTION_REGISTRY_TIMING,
  type ConnectionRegistryTiming,
  connectionRegistryTiming,
} from '../../src/connection-registry/connection-registry-timing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import { SessionGateway } from '../../src/session/session.gateway';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

function emitWithAck(
  client: Socket,
  event: string,
  ...args: unknown[]
): Promise<unknown> {
  return new Promise((resolve) => client.emit(event, ...args, resolve));
}

function nextEvent(client: Socket, event: string): Promise<unknown> {
  return new Promise((resolve) => client.once(event, resolve));
}

describe('Session gateway over a real socket', () => {
  let app: NestExpressApplication;
  let appUrl: string;
  const clients: Socket[] = [];

  async function connectClient(
    options: Partial<ManagerOptions & SocketOptions> = {},
  ): Promise<Socket> {
    const client: Socket = io(appUrl, {
      transports: ['websocket'],
      ...options,
    });
    clients.push(client);
    await new Promise<void>((resolve) =>
      client.once('connect', () => resolve()),
    );
    return client;
  }

  async function disconnectClient(client: Socket): Promise<void> {
    const socketID: string | undefined = client.id;
    client.disconnect();
    if (!socketID) return;

    const connectionRegistryService: ConnectionRegistryService = app.get(
      ConnectionRegistryService,
    );
    const sessionGateway: SessionGateway = app.get(SessionGateway);
    for (let attempt: number = 0; attempt < 100; attempt += 1) {
      const socketIsConnected: boolean =
        sessionGateway.io.sockets.sockets.has(socketID);
      const connectionExists: boolean =
        (await connectionRegistryService.getConnection(socketID)) !== null;
      if (!socketIsConnected && !connectionExists) return;

      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    throw new Error(`Socket ${socketID} did not disconnect cleanly`);
  }

  beforeAll(async () => {
    const testConnectionRegistryTiming: ConnectionRegistryTiming = {
      ...connectionRegistryTiming,
      disconnectGracePeriodMs: 100,
    };
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(CONNECTION_REGISTRY_TIMING)
        .useValue(testConnectionRegistryTiming),
    );
    await app.listen(0);
    appUrl = await app.getUrl();
  });

  afterEach(async () => {
    for (const client of clients) {
      await disconnectClient(client);
    }
    clients.length = 0;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects a rate limited handshake with a typed connect error', async () => {
    const clientIp: string = '203.0.113.7';
    const rateLimitService: RateLimitService = app.get(RateLimitService);
    for (let attempt: number = 0; attempt < 20; attempt += 1) {
      await rateLimitService.consumeWsConnection(clientIp);
    }
    const client: Socket = io(appUrl, {
      transports: ['websocket'],
      extraHeaders: { 'x-forwarded-for': clientIp },
    });
    clients.push(client);

    const connectError: unknown = await nextEvent(client, 'connect_error');

    expect(connectError).toMatchObject({
      message: 'Too many requests',
      data: { statusCode: 429, code: ErrorCode.RATE_LIMIT_EXCEEDED },
    });
    expect(client.connected).toBe(false);
  });

  it('acknowledges a contract violation with a bad request error', async () => {
    const client: Socket = await connectClient();

    const ack = await emitWithAck(client, sessionWsEvent.join, {
      sessionID: 'session-1',
    });

    expect(ack).toMatchObject({
      success: false,
      error: { statusCode: 400, code: ErrorCode.BAD_REQUEST },
    });
  });

  it('acknowledges a join and broadcasts the updated session', async () => {
    const client: Socket = await connectClient();
    const session: Session = buildSession();
    const playerID: PlayerId = PlayerIdSchema.parse('carol');
    await app.get(RedisService).setJSON(`session:${session.id}`, session);
    const broadcast: Promise<unknown> = nextEvent(
      client,
      sessionWsServerEvent.update,
    );

    const ack = await emitWithAck(client, sessionWsEvent.join, {
      sessionID: session.id,
      playerID,
    });

    expect(ack).toEqual({
      success: true,
      reconnectToken: expect.any(String),
    });
    expect(SessionSchema.parse(await broadcast).players).toEqual([
      ...session.players,
      { username: playerID, isGuest: true, connected: true },
    ]);
  });

  it('authenticates a reconnect and broadcasts the disconnection after the grace period', async () => {
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
    const session: Session = buildSession({
      players: [
        buildPlayer(user.username, false, {
          id: user.id,
          isGuest: false,
        }),
      ],
    });
    await app.get(RedisService).setJSON(`session:${session.id}`, session);
    const observer: Socket = await connectClient();
    const observerID: PlayerId = PlayerIdSchema.parse('observer');
    const observerJoin: unknown = await emitWithAck(
      observer,
      sessionWsEvent.join,
      {
        sessionID: session.id,
        playerID: observerID,
      },
    );
    expect(observerJoin).toMatchObject({ success: true });
    const authenticatedClient: Socket = await connectClient({
      auth: { access_token: accessToken },
    });
    const reconnectBroadcast: Promise<unknown> = nextEvent(
      observer,
      sessionWsServerEvent.update,
    );

    const reconnectAck: unknown = await emitWithAck(
      authenticatedClient,
      sessionWsEvent.reconnect,
      { sessionID: session.id, playerID: user.username },
    );

    expect(reconnectAck).toEqual({ success: true });
    expect(
      SessionSchema.parse(await reconnectBroadcast).players,
    ).toContainEqual(
      expect.objectContaining({
        username: user.username,
        isGuest: false,
        connected: true,
      }),
    );
    const authenticatedSocketID: string | undefined = authenticatedClient.id;
    if (!authenticatedSocketID) {
      throw new Error('Authenticated socket has no identifier');
    }
    const disconnectBroadcast: Promise<unknown> = nextEvent(
      observer,
      sessionWsServerEvent.update,
    );

    authenticatedClient.disconnect();

    expect(
      SessionSchema.parse(await disconnectBroadcast).players,
    ).toContainEqual(
      expect.objectContaining({
        username: user.username,
        isGuest: false,
        connected: false,
      }),
    );
    expect(
      await app
        .get(ConnectionRegistryService)
        .getConnection(authenticatedSocketID),
    ).toBeNull();
  });

  it('restores a guest player only for the client holding its reconnect token', async () => {
    const session: Session = buildSession();
    const playerID: PlayerId = PlayerIdSchema.parse('carol');
    await app.get(RedisService).setJSON(`session:${session.id}`, session);
    const guestClient: Socket = await connectClient();
    const { reconnectToken }: SessionJoinAck = SessionJoinAckSchema.parse(
      await emitWithAck(guestClient, sessionWsEvent.join, {
        sessionID: session.id,
        playerID,
      }),
    );
    await disconnectClient(guestClient);
    const intruderClient: Socket = await connectClient();
    const restoredGuestClient: Socket = await connectClient();

    const intruderAck: unknown = await emitWithAck(
      intruderClient,
      sessionWsEvent.reconnect,
      { sessionID: session.id, playerID },
    );
    const restoredGuestAck: unknown = await emitWithAck(
      restoredGuestClient,
      sessionWsEvent.reconnect,
      { sessionID: session.id, playerID, reconnectToken },
    );

    expect(intruderAck).toMatchObject({
      success: false,
      error: { statusCode: 403, code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
    });
    expect(restoredGuestAck).toEqual({ success: true });
  });

  it('rejects an authenticated user reconnecting as another registered player', async () => {
    const owner: User = buildUser();
    const intruder: User = buildUser({
      id: '00000000-0000-4000-8000-000000000002',
      username: PlayerIdSchema.parse('intruder'),
      email: 'intruder@cityborn.test',
    });
    await app.get(PrismaService).user.create({
      data: {
        id: intruder.id,
        email: intruder.email,
        username: intruder.username,
        type: intruder.type,
        isVerified: intruder.isVerified,
      },
    });
    const intruderAccessToken: string = await createAccessToken(
      app,
      intruder.id,
    );
    const session: Session = buildSession({
      players: [
        buildPlayer(owner.username, false, { id: owner.id, isGuest: false }),
      ],
    });
    await app.get(RedisService).setJSON(`session:${session.id}`, session);
    const intruderClient: Socket = await connectClient({
      auth: { access_token: intruderAccessToken },
    });

    const intruderAck: unknown = await emitWithAck(
      intruderClient,
      sessionWsEvent.reconnect,
      { sessionID: session.id, playerID: owner.username },
    );

    expect(intruderAck).toMatchObject({
      success: false,
      error: { statusCode: 403, code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
    });
  });
});
