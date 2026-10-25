import {
  buildPack,
  buildTheme,
  buildUser,
  buildWorldLocation,
  contract,
  ErrorCode,
  GameStatus,
  type Pack,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  type SessionJoinAck,
  SessionJoinAckSchema,
  SessionMode,
  SessionSchema,
  sessionWsEvent,
  sessionWsServerEvent,
  type Theme,
  type User,
  type WorldLocation,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from 'socket.io-client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SessionGateway } from '../../src/session/session.gateway';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

type RecordedSoloGame = {
  mode: string;
  results: unknown;
  users: { id: string }[];
};

type SoloPlayerAccess = {
  playerID: PlayerId;
  authorization: Record<string, string>;
  socketOptions: Partial<ManagerOptions & SocketOptions>;
};

type PlayedSoloGame = {
  client: Socket;
  joinAck: SessionJoinAck;
  finishedSession: Session;
};

function emitWithAck({
  client,
  event,
  payload,
}: {
  client: Socket;
  event: string;
  payload?: unknown;
}): Promise<unknown> {
  const args: unknown[] = payload === undefined ? [] : [payload];
  return new Promise((resolve) => client.emit(event, ...args, resolve));
}

function nextSessionUpdate(client: Socket): Promise<Session> {
  return new Promise((resolve) =>
    client.once(sessionWsServerEvent.update, (session: unknown) =>
      resolve(SessionSchema.parse(session)),
    ),
  );
}

describe('Solo session over the session channel', () => {
  let app: NestExpressApplication;
  let appUrl: string;
  let prismaService: PrismaService;
  let pack: Pack;
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

  async function waitForSocketRemoval({
    socketID,
    remainingAttempts,
  }: {
    socketID: string;
    remainingAttempts: number;
  }): Promise<void> {
    if (!app.get(SessionGateway).io.sockets.sockets.has(socketID)) return;
    if (remainingAttempts === 0)
      throw new Error(`Socket ${socketID} did not disconnect cleanly`);

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    await waitForSocketRemoval({
      socketID,
      remainingAttempts: remainingAttempts - 1,
    });
  }

  async function disconnectClient(client: Socket): Promise<void> {
    const socketID: string | undefined = client.id;
    client.disconnect();
    if (!socketID) return;

    await waitForSocketRemoval({ socketID, remainingAttempts: 100 });
  }

  async function persistPackWithTwoGuessObjects(): Promise<Pack> {
    const location: WorldLocation = buildWorldLocation();
    await prismaService.worldLocation.create({
      data: {
        id: location.id,
        osm_type: location.osm_type,
        external_id: location.source.external_id,
        name: location.name,
        display_name: location.display_name,
        centroid: location.centroid,
        source: location.source,
        geometry: {
          create: { data: { type: 'Point', coordinates: [2.3522, 48.8566] } },
        },
      },
    });
    const theme: Theme = buildTheme();
    await prismaService.theme.create({ data: theme });
    const persistedPack: Pack = buildPack({ themeId: theme.id });
    await prismaService.pack.create({
      data: {
        id: persistedPack.id,
        name: persistedPack.name,
        isPublished: persistedPack.isPublished,
        themeId: persistedPack.themeId,
        guessObjects: {
          create: [
            { name: 'Tour Eiffel', world_location_id: location.id },
            { name: 'Louvre', world_location_id: location.id },
          ],
        },
      },
    });
    return persistedPack;
  }

  async function persistUser(user: User): Promise<void> {
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
        isVerified: user.isVerified,
      },
    });
  }

  async function createSoloSession(
    authorization: Record<string, string>,
  ): Promise<Session> {
    const response: request.Response = await request(app.getHttpServer())
      .post(contract.session.createSession.path)
      .set(authorization)
      .send({ mode: SessionMode.SOLO })
      .expect(201);
    return SessionSchema.parse(response.body);
  }

  async function playRound(client: Socket): Promise<Session> {
    const guessUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({
      client,
      event: sessionWsEvent.guess,
      payload: { guess: { coordinates: { lat: 48.8566, lng: 2.3522 } } },
    });
    const revealed: Session = await guessUpdate;
    expect(revealed.currentGame?.state.guessObjects).toHaveLength(
      (Object.values(revealed.currentGame?.state.results ?? {})[0]?.results
        .length ?? 0) + 1,
    );
    expect(
      Object.values(
        revealed.currentGame?.state.currentRound?.playersGuesses ?? {},
      )[0],
    ).toMatchObject({ distance: 0, points: 1000 });
    const nextRoundUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({ client, event: sessionWsEvent.nextRound });
    return await nextRoundUpdate;
  }

  async function playSoloGame({
    playerID,
    authorization,
    socketOptions,
  }: SoloPlayerAccess): Promise<PlayedSoloGame> {
    const session: Session = await createSoloSession(authorization);
    const client: Socket = await connectClient(socketOptions);
    const joinAck: SessionJoinAck = SessionJoinAckSchema.parse(
      await emitWithAck({
        client,
        event: sessionWsEvent.join,
        payload: { sessionID: session.id, playerID },
      }),
    );
    await emitWithAck({
      client,
      event: sessionWsEvent.updateGameConfig,
      payload: { gameConfig: { packs: [pack], timer: 25, nbOfObjects: 2 } },
    });
    const startUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({ client, event: sessionWsEvent.startGame });
    const started: Session = await startUpdate;
    expect(started.currentGame?.state.guessObjects).toEqual([]);
    expect(JSON.stringify(started)).not.toContain('world_location');
    const fetched: request.Response = await request(app.getHttpServer())
      .get(contract.session.getSession.path.replace(':id', session.id))
      .expect(200);
    expect(JSON.stringify(fetched.body)).not.toContain('world_location');
    const reconnectUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({
      client,
      event: sessionWsEvent.reconnect,
      payload: {
        sessionID: session.id,
        playerID,
        reconnectToken: joinAck.reconnectToken,
      },
    });
    const reconnected: Session = await reconnectUpdate;
    expect(JSON.stringify(reconnected)).not.toContain('world_location');
    const forgedAck: unknown = await emitWithAck({
      client,
      event: sessionWsEvent.guess,
      payload: {
        guess: {
          coordinates: { lat: 48.8566, lng: 2.3522 },
          distance: 0,
          points: 999999,
          win: true,
        },
      },
    });
    expect(forgedAck).toMatchObject({
      success: false,
      error: { statusCode: 400 },
    });

    await playRound(client);
    const finishedSession: Session = await playRound(client);

    return { client, joinAck, finishedSession };
  }

  async function findRecordedSoloGames(): Promise<RecordedSoloGame[]> {
    return await prismaService.gameRecord.findMany({
      select: { mode: true, results: true, users: { select: { id: true } } },
    });
  }

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    appUrl = await app.getUrl();
    prismaService = app.get(PrismaService);
  });

  beforeEach(async () => {
    pack = await persistPackWithTwoGuessObjects();
  });

  afterEach(async () => {
    await Promise.all(clients.map(disconnectClient));
    clients.length = 0;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('plays a guest solo game and records it once on the server', async () => {
    const playerID: PlayerId = PlayerIdSchema.parse('guest');

    const { client, joinAck, finishedSession }: PlayedSoloGame =
      await playSoloGame({
        playerID,
        authorization: {},
        socketOptions: {},
      });
    const replayedNextRoundAck: unknown = await emitWithAck({
      client,
      event: sessionWsEvent.nextRound,
    });

    expect(joinAck.reconnectToken).toEqual(expect.any(String));
    expect(finishedSession).toMatchObject({
      hostID: playerID,
      players: [{ username: playerID, isGuest: true, connected: true }],
      currentGame: { status: GameStatus.IN_RESULTS },
    });
    expect(
      finishedSession.currentGame?.state.results[playerID].results,
    ).toHaveLength(2);
    expect(replayedNextRoundAck).toMatchObject({
      success: false,
      error: { code: ErrorCode.SESSION_NO_CURRENT_GAME },
    });
    expect(await findRecordedSoloGames()).toEqual([
      {
        mode: SessionMode.SOLO,
        results: { guest: { results: expect.any(Array) } },
        users: [],
      },
    ]);
  });

  it('plays a signed-in solo game and records it for the account', async () => {
    const user: User = buildUser();
    await persistUser(user);
    const accessToken: string = await createAccessToken(app, user.id);

    const { joinAck, finishedSession }: PlayedSoloGame = await playSoloGame({
      playerID: user.username,
      authorization: { Authorization: `Bearer ${accessToken}` },
      socketOptions: { auth: { access_token: accessToken } },
    });

    expect(joinAck.reconnectToken).toBeUndefined();
    expect(finishedSession.currentGame?.status).toBe(GameStatus.IN_RESULTS);
    expect(await findRecordedSoloGames()).toEqual([
      {
        mode: SessionMode.SOLO,
        results: { [user.username]: { results: expect.any(Array) } },
        users: [{ id: user.id }],
      },
    ]);
  });

  it('rejects a second player joining a solo session', async () => {
    const session: Session = await createSoloSession({});
    const soloClient: Socket = await connectClient();
    await emitWithAck({
      client: soloClient,
      event: sessionWsEvent.join,
      payload: {
        sessionID: session.id,
        playerID: PlayerIdSchema.parse('guest'),
      },
    });
    const intruderClient: Socket = await connectClient();

    const intruderAck: unknown = await emitWithAck({
      client: intruderClient,
      event: sessionWsEvent.join,
      payload: {
        sessionID: session.id,
        playerID: PlayerIdSchema.parse('intruder'),
      },
    });

    expect(intruderAck).toMatchObject({
      success: false,
      error: { statusCode: 403, code: ErrorCode.SESSION_SOLO_NOT_JOINABLE },
    });
  });
});
