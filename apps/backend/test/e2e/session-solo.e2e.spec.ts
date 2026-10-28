import {
  API_VERSION_HEADER_NAME,
  buildPack,
  buildTheme,
  buildUser,
  buildWorldLocation,
  CLIENT_API_VERSION,
  contract,
  defaultGuess,
  ErrorCode,
  GameStatus,
  type Pack,
  type PlayerId,
  PlayerIdSchema,
  RoundStatus,
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
import { RedisService } from '../../src/redis/redis.service';
import { SessionGateway } from '../../src/session/session.gateway';
import {
  type SessionState,
  SessionStateSchema,
} from '../../src/session/session-game-protocol';
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
    client.once(sessionWsServerEvent.update, (session: unknown) => {
      expect(session).not.toHaveProperty('scoringMode');
      expect(session).not.toHaveProperty('scoringProtocol');
      resolve(SessionSchema.parse(session));
    }),
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
      auth: { apiVersion: CLIENT_API_VERSION, ...options.auth },
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
    clientApiVersion: number | undefined,
  ): Promise<Session> {
    const response: request.Response = await request(app.getHttpServer())
      .post(contract.session.createSession.path)
      .set({
        ...authorization,
        ...(clientApiVersion === undefined
          ? {}
          : { [API_VERSION_HEADER_NAME]: String(clientApiVersion) }),
      })
      .send({ mode: SessionMode.SOLO })
      .expect(201);
    expect(response.body).not.toHaveProperty('scoringMode');
    expect(response.body).not.toHaveProperty('scoringProtocol');
    return SessionSchema.parse(response.body);
  }

  async function playRound(client: Socket): Promise<Session> {
    const guessUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({
      client,
      event: sessionWsEvent.submitGuess,
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
    const session: Session = await createSoloSession(
      authorization,
      CLIENT_API_VERSION,
    );
    let client: Socket = await connectClient(socketOptions);
    const joinAck: SessionJoinAck = SessionJoinAckSchema.parse(
      await emitWithAck({
        client,
        event: sessionWsEvent.join,
        payload: {
          sessionID: session.id,
          playerID,
        },
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
      .set(API_VERSION_HEADER_NAME, String(CLIENT_API_VERSION))
      .expect(200);
    expect(JSON.stringify(fetched.body)).not.toContain('world_location');
    await Promise.all(
      [undefined, '6', 'invalid'].map(async (version) => {
        const headers: Record<string, string> =
          version === undefined ? {} : { [API_VERSION_HEADER_NAME]: version };
        const rejected: request.Response = await request(app.getHttpServer())
          .get(contract.session.getSession.path.replace(':id', session.id))
          .set(headers)
          .expect(400);
        expect(JSON.stringify(rejected.body)).not.toContain('world_location');
        expect(rejected.body).not.toHaveProperty('scoringMode');
      }),
    );
    await disconnectClient(client);
    client = await connectClient(socketOptions);
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
    expect(reconnected.currentGame?.state.currentRound?.deadline).toBe(
      started.currentGame?.state.currentRound?.deadline,
    );
    expect(reconnected.currentGame?.state.guessObjectsIds).toEqual(
      started.currentGame?.state.guessObjectsIds,
    );
    const forgedAck: unknown = await emitWithAck({
      client,
      event: sessionWsEvent.submitGuess,
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

    const legacyGuessAck: unknown = await emitWithAck({
      client,
      event: sessionWsEvent.guess,
      payload: { guess: { ...defaultGuess, points: 999999 } },
    });
    expect(legacyGuessAck).toMatchObject({
      success: false,
      error: { statusCode: 400, code: ErrorCode.BAD_REQUEST },
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
    const replayUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({ client, event: sessionWsEvent.playAgain });
    const replayed: Session = await replayUpdate;
    expect(replayed).not.toHaveProperty('scoringProtocol');
    expect(replayed).not.toHaveProperty('scoringMode');
    expect(replayed.currentGame?.state.guessObjects).toEqual([]);
    expect(JSON.stringify(replayed)).not.toContain('world_location');
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

  it('plays a cookie-authenticated modern game and reconnects with the same identity', async () => {
    const user: User = buildUser();
    await persistUser(user);
    const accessToken: string = await createAccessToken(app, user.id);
    const cookie: string = `cityborn_access_token=${accessToken}`;

    const { joinAck, finishedSession }: PlayedSoloGame = await playSoloGame({
      playerID: user.username,
      authorization: { Cookie: cookie, Origin: 'http://localhost:3000' },
      socketOptions: {
        withCredentials: true,
        extraHeaders: { cookie, origin: 'http://localhost:3000' },
      },
    });

    expect(joinAck.reconnectToken).toBeUndefined();
    expect(finishedSession.players[0].id).toBe(user.id);
  });

  it.each<{ raw: string | undefined; scoringMode: 'legacy' | 'server' }>([
    { raw: undefined, scoringMode: 'legacy' },
    { raw: '6', scoringMode: 'legacy' },
    { raw: 'invalid', scoringMode: 'legacy' },
    { raw: '7.5', scoringMode: 'legacy' },
    { raw: '7', scoringMode: 'server' },
    { raw: '999', scoringMode: 'server' },
  ])(
    'selects $scoringMode from HTTP version $raw and never returns its private marker',
    async ({ raw, scoringMode }) => {
      const headers: Record<string, string> =
        raw === undefined ? {} : { [API_VERSION_HEADER_NAME]: raw };

      const created: request.Response = await request(app.getHttpServer())
        .post(contract.session.createSession.path)
        .set(headers)
        .send({ mode: SessionMode.SOLO, scoringProtocol: 'server-scoring' })
        .expect(201);
      const session: Session = SessionSchema.parse(created.body);
      const stored: unknown = await app
        .get(RedisService)
        .getJSON(`session:${session.id}`);
      const fetched: request.Response = await request(app.getHttpServer())
        .get(contract.session.getSession.path.replace(':id', session.id))
        .set(headers)
        .expect(200);

      expect(stored).toMatchObject({ scoringMode });
      expect(created.body).not.toHaveProperty('scoringMode');
      expect(created.body).not.toHaveProperty('scoringProtocol');
      expect(fetched.body).not.toHaveProperty('scoringMode');
      expect(fetched.body).not.toHaveProperty('scoringProtocol');
    },
  );

  it('allows the version header through browser CORS preflight', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .options(contract.session.createSession.path)
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set(
        'Access-Control-Request-Headers',
        'content-type,x-api-version,x-visitor-id',
      )
      .expect(204);

    expect(response.headers['access-control-allow-headers']).toContain(
      'x-api-version',
    );
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('records zero points for a modern guess arriving after the persisted deadline', async () => {
    const session: Session = await createSoloSession({}, CLIENT_API_VERSION);
    const client: Socket = await connectClient();
    await emitWithAck({
      client,
      event: sessionWsEvent.join,
      payload: {
        sessionID: session.id,
        playerID: PlayerIdSchema.parse('guest'),
      },
    });
    await emitWithAck({
      client,
      event: sessionWsEvent.updateGameConfig,
      payload: { gameConfig: { packs: [pack], timer: 25, nbOfObjects: 2 } },
    });
    await emitWithAck({ client, event: sessionWsEvent.startGame });
    const stored: SessionState = SessionStateSchema.parse(
      await app.get(RedisService).getJSON(`session:${session.id}`),
    );
    if (!stored.currentGame?.state.currentRound)
      throw new Error('Missing active round');
    stored.currentGame.state.currentRound.deadline = 0;
    await app.get(RedisService).setJSON(`session:${session.id}`, stored);
    const update: Promise<Session> = nextSessionUpdate(client);

    const ack: unknown = await emitWithAck({
      client,
      event: sessionWsEvent.submitGuess,
      payload: { guess: { coordinates: { lat: 48.8566, lng: 2.3522 } } },
    });

    expect(ack).toEqual({ success: true });
    expect(
      (await update).currentGame?.state.currentRound?.playersGuesses?.[
        PlayerIdSchema.parse('guest')
      ],
    ).toEqual(defaultGuess);
  });

  it('does not expose answer locations through public guess-object routes', async () => {
    const session: Session = await createSoloSession({}, CLIENT_API_VERSION);
    const client: Socket = await connectClient();
    await emitWithAck({
      client,
      event: sessionWsEvent.join,
      payload: {
        sessionID: session.id,
        playerID: PlayerIdSchema.parse('guest'),
      },
    });
    await emitWithAck({
      client,
      event: sessionWsEvent.updateGameConfig,
      payload: { gameConfig: { packs: [pack], timer: 25, nbOfObjects: 2 } },
    });
    const startUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({ client, event: sessionWsEvent.startGame });
    const started: Session = await startUpdate;
    const stored: SessionState = SessionStateSchema.parse(
      await app.get(RedisService).getJSON(`session:${session.id}`),
    );
    const realIds: string[] = stored.currentGame?.state.guessObjectsIds ?? [];
    const publicIds: string[] =
      started.currentGame?.state.guessObjectsIds ?? [];
    const currentPublicId: string | undefined =
      started.currentGame?.state.currentRound?.guessObjectId;
    if (realIds.length !== 2 || publicIds.length !== 2 || !currentPublicId)
      throw new Error('Missing answer IDs');

    const byId: request.Response = await request(app.getHttpServer())
      .get(
        contract.guessObjects.getGuessObject.path.replace(
          ':id',
          currentPublicId,
        ),
      )
      .expect(404);
    const byList: request.Response = await request(app.getHttpServer())
      .get(contract.guessObjects.getGuessObjects.path)
      .query({ guessObjectsIds: publicIds.join(',') })
      .expect(200);
    const realAnswer: request.Response = await request(app.getHttpServer())
      .get(contract.guessObjects.getGuessObject.path.replace(':id', realIds[0]))
      .expect(200);

    expect(publicIds).not.toEqual(realIds);
    expect(JSON.stringify(started)).not.toContain(realIds[0]);
    expect(JSON.stringify(started)).not.toContain(realIds[1]);
    expect(
      started.currentGame?.state.guessObjectPreviews?.map(({ id }) => id),
    ).toEqual(publicIds);
    expect(started.currentGame?.state.currentRound?.guessObjectId).toBe(
      publicIds[0],
    );
    expect(byId.body).not.toHaveProperty('world_location_preview');
    expect(byList.body).toEqual([]);
    expect(realAnswer.body.world_location_preview).toHaveProperty('name');
  });

  it('expires a round without a guess event and broadcasts default results', async () => {
    const session: Session = await createSoloSession({}, CLIENT_API_VERSION);
    const client: Socket = await connectClient();
    await emitWithAck({
      client,
      event: sessionWsEvent.join,
      payload: {
        sessionID: session.id,
        playerID: PlayerIdSchema.parse('guest'),
      },
    });
    await emitWithAck({
      client,
      event: sessionWsEvent.updateGameConfig,
      payload: { gameConfig: { packs: [pack], timer: 25, nbOfObjects: 2 } },
    });
    await emitWithAck({ client, event: sessionWsEvent.startGame });
    const stored: SessionState = SessionStateSchema.parse(
      await app.get(RedisService).getJSON(`session:${session.id}`),
    );
    if (!stored.currentGame?.state.currentRound)
      throw new Error('Missing active round');
    stored.currentGame.state.currentRound.deadline = 0;
    await app.get(RedisService).setJSON(`session:${session.id}`, stored);
    const resultUpdate: Promise<Session> = nextSessionUpdate(client);

    const revealed: Session = await resultUpdate;

    expect(revealed.currentGame?.state.currentRound?.status).toBe(
      RoundStatus.SHOWING_RESULTS,
    );
    expect(
      revealed.currentGame?.state.currentRound?.playersGuesses?.[
        PlayerIdSchema.parse('guest')
      ],
    ).toEqual(defaultGuess);
    const nextUpdate: Promise<Session> = nextSessionUpdate(client);
    await emitWithAck({ client, event: sessionWsEvent.nextRound });
    const next: Session = await nextUpdate;
    expect(
      next.currentGame?.state.results[PlayerIdSchema.parse('guest')].results,
    ).toMatchObject([{ points: 0, distance: -1 }]);
  }, 15000);

  it('rejects a second player joining a solo session', async () => {
    const session: Session = await createSoloSession({}, CLIENT_API_VERSION);
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

  it.each<number | undefined>([undefined, 6, CLIENT_API_VERSION])(
    'rejects joining and reconnecting across protocol boundaries for %s sessions',
    async (clientApiVersion) => {
      const session: Session = await createSoloSession({}, clientApiVersion);
      const owner: Socket = await connectClient({
        auth: { apiVersion: clientApiVersion },
      });
      const playerID: PlayerId = PlayerIdSchema.parse('guest');
      const { reconnectToken }: SessionJoinAck = SessionJoinAckSchema.parse(
        await emitWithAck({
          client: owner,
          event: sessionWsEvent.join,
          payload: { sessionID: session.id, playerID },
        }),
      );
      const mismatchedVersion: number | undefined =
        clientApiVersion === CLIENT_API_VERSION
          ? undefined
          : CLIENT_API_VERSION;
      const intruder: Socket = await connectClient({
        auth: { apiVersion: mismatchedVersion },
      });

      const joined: unknown = await emitWithAck({
        client: intruder,
        event: sessionWsEvent.join,
        payload: {
          sessionID: session.id,
          playerID: PlayerIdSchema.parse('intruder'),
        },
      });
      const reconnected: unknown = await emitWithAck({
        client: intruder,
        event: sessionWsEvent.reconnect,
        payload: {
          sessionID: session.id,
          playerID,
          reconnectToken,
        },
      });

      const mismatchedHeaders: Record<string, string> =
        mismatchedVersion === undefined
          ? {}
          : { [API_VERSION_HEADER_NAME]: String(mismatchedVersion) };
      const fetched: request.Response = await request(app.getHttpServer())
        .get(contract.session.getSession.path.replace(':id', session.id))
        .set(mismatchedHeaders)
        .expect(400);
      expect(fetched.body).toMatchObject({
        code: ErrorCode.BAD_REQUEST,
        message: expect.stringContaining('Créez une nouvelle session'),
      });
      expect(JSON.stringify(fetched.body)).not.toContain('world_location');
      const persisted: unknown = await app
        .get(RedisService)
        .getJSON(`session:${session.id}`);
      expect(persisted).toMatchObject({
        scoringMode:
          clientApiVersion === CLIENT_API_VERSION ? 'server' : 'legacy',
      });
      expect(joined).toMatchObject({
        success: false,
        error: { statusCode: 400, code: ErrorCode.BAD_REQUEST },
      });
      expect(reconnected).toMatchObject({
        success: false,
        error: { statusCode: 400, code: ErrorCode.BAD_REQUEST },
      });
      const intruderID: string = intruder.id ?? '';
      expect(
        app
          .get(SessionGateway)
          .io.sockets.sockets.get(intruderID)
          ?.rooms.has(session.id),
      ).toBe(false);
      expect(
        app.get(SessionGateway).io.sockets.sockets.get(intruderID)?.data.player,
      ).toBeFalsy();
    },
  );

  it('continues an old Redis game with complete HTTP and WS objects and client-calculated scores', async () => {
    const session: Session = await createSoloSession({}, undefined);
    const owner: Socket = await connectClient({
      auth: { apiVersion: undefined },
    });
    const playerID: PlayerId = PlayerIdSchema.parse('guest');
    const { reconnectToken }: SessionJoinAck = SessionJoinAckSchema.parse(
      await emitWithAck({
        client: owner,
        event: sessionWsEvent.join,
        payload: { sessionID: session.id, playerID },
      }),
    );
    await emitWithAck({
      client: owner,
      event: sessionWsEvent.updateGameConfig,
      payload: { gameConfig: { packs: [pack], timer: 25, nbOfObjects: 2 } },
    });
    const startUpdate: Promise<Session> = nextSessionUpdate(owner);
    await emitWithAck({ client: owner, event: sessionWsEvent.startGame });
    const started: Session = await startUpdate;
    expect(started.currentGame?.state.guessObjects).toHaveLength(2);
    expect(JSON.stringify(started)).toContain('world_location');
    const oldState: Session = SessionSchema.parse(started);
    delete oldState.serverTime;
    if (!oldState.currentGame?.state.currentRound)
      throw new Error('Missing active round');
    delete oldState.currentGame.state.guessObjects;
    delete oldState.currentGame.state.currentRound.deadline;
    await app.get(RedisService).setJSON(`session:${session.id}`, oldState);
    await request(app.getHttpServer())
      .get(contract.session.getSession.path.replace(':id', session.id))
      .set(API_VERSION_HEADER_NAME, String(CLIENT_API_VERSION))
      .expect(400);
    expect(
      await app.get(RedisService).getJSON(`session:${session.id}`),
    ).not.toHaveProperty('scoringMode');
    const fetched: request.Response = await request(app.getHttpServer())
      .get(contract.session.getSession.path.replace(':id', session.id))
      .expect(200);
    expect(
      SessionSchema.parse(fetched.body).currentGame?.state.guessObjects,
    ).toHaveLength(2);
    expect(JSON.stringify(fetched.body)).toContain('world_location');
    const restored: Socket = await connectClient({
      auth: { apiVersion: undefined },
    });
    const reconnectUpdate: Promise<Session> = nextSessionUpdate(restored);
    await emitWithAck({
      client: restored,
      event: sessionWsEvent.reconnect,
      payload: { sessionID: session.id, playerID, reconnectToken },
    });
    const reconnected: Session = await reconnectUpdate;
    expect(reconnected.currentGame?.state.guessObjects).toHaveLength(2);
    expect(
      reconnected.currentGame?.state.currentRound?.deadline,
    ).toBeUndefined();
    const modernAck: unknown = await emitWithAck({
      client: restored,
      event: sessionWsEvent.submitGuess,
      payload: { guess: {} },
    });
    expect(modernAck).toMatchObject({
      success: false,
      error: { code: ErrorCode.BAD_REQUEST },
    });

    const playLegacyRound: () => Promise<Session> = async () => {
      const resultsUpdate: Promise<Session> = nextSessionUpdate(restored);
      const ack: unknown = await emitWithAck({
        client: restored,
        event: sessionWsEvent.guess,
        payload: { guess: { ...defaultGuess, points: 765, distance: 123 } },
      });
      expect(ack).toEqual({ success: true });
      const results: Session = await resultsUpdate;
      expect(results.currentGame?.state.currentRound).toMatchObject({
        status: RoundStatus.SHOWING_RESULTS,
        playersGuesses: { guest: { points: 765, distance: 123 } },
      });
      expect(results.currentGame?.state.guessObjects).toHaveLength(2);
      const nextUpdate: Promise<Session> = nextSessionUpdate(restored);
      await emitWithAck({ client: restored, event: sessionWsEvent.nextRound });
      return nextUpdate;
    };

    const secondRound: Session = await playLegacyRound();
    expect(secondRound.currentGame?.state.currentRound?.status).toBe(
      RoundStatus.GUESSING,
    );
    const finished: Session = await playLegacyRound();
    expect(finished.currentGame?.status).toBe(GameStatus.IN_RESULTS);
    expect(
      finished.currentGame?.state.results[playerID].results.map(
        ({ points }) => points,
      ),
    ).toEqual([765, 765]);
    const replayUpdate: Promise<Session> = nextSessionUpdate(restored);
    await emitWithAck({ client: restored, event: sessionWsEvent.playAgain });
    const replayed: Session = await replayUpdate;
    expect(replayed).not.toHaveProperty('scoringProtocol');
    expect(replayed).not.toHaveProperty('scoringMode');
    expect(replayed.currentGame?.state.guessObjects).toHaveLength(2);
    expect(replayed.currentGame?.state.currentRound?.status).toBe(
      RoundStatus.GUESSING,
    );
  });
});
