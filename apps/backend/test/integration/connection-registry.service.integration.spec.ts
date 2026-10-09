import {
  buildSession,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionSchema,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import {
  type ConnectionInfo,
  ConnectionRegistryService,
  type PlayerPresence,
} from '../../src/connection-registry/connection-registry.service';
import type { ConnectionRegistryTiming } from '../../src/connection-registry/connection-registry-timing';
import type { EventService } from '../../src/event/event.service';
import type { GameService } from '../../src/game/game.service';
import type { IdService } from '../../src/id/id.service';
import { LockService } from '../../src/lock/lock.service';
import { RedisService } from '../../src/redis/redis.service';
import {
  type JoinedSession,
  SessionService,
} from '../../src/session/session.service';
import { createTestInfrastructure } from '../support/infrastructure';

const timing: ConnectionRegistryTiming = {
  disconnectGracePeriodMs: 300,
  leaseMs: 400,
  heartbeatIntervalMs: 100,
  presenceCheckIntervalMs: 25,
  presenceCheckClaimMs: 1_000,
};

const sessionID: SessionId = SessionIdSchema.parse('session-1');
const hostID: PlayerId = PlayerIdSchema.parse('host');
const bobID: PlayerId = PlayerIdSchema.parse('bob');

function delay(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil({
  condition,
  deadline,
}: {
  condition: () => Promise<boolean>;
  deadline: number;
}): Promise<void> {
  if (await condition()) return;
  if (Date.now() > deadline) throw new Error('Condition was not met in time');

  await delay(20);
  await waitUntil({ condition, deadline });
}

describe('ConnectionRegistryService with Redis', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { redis }: typeof infrastructure = infrastructure;
  const wideEventService: WideEventService = createMock<WideEventService>();
  const registries: ConnectionRegistryService[] = [];

  function createRegistry(): ConnectionRegistryService {
    const connectionRegistryService: ConnectionRegistryService =
      new ConnectionRegistryService(redis, timing, wideEventService);
    registries.push(connectionRegistryService);
    return connectionRegistryService;
  }

  function startRegistry(): ConnectionRegistryService {
    const connectionRegistryService: ConnectionRegistryService =
      createRegistry();
    connectionRegistryService.onModuleInit();
    return connectionRegistryService;
  }

  function createSessionService(
    connectionRegistryService: ConnectionRegistryService,
  ): SessionService {
    return new SessionService(
      new RedisService(redis, wideEventService),
      new LockService(redis, wideEventService),
      createMock<IdService>(),
      createMock<GameService>(),
      createMock<EventService>(),
      connectionRegistryService,
    );
  }

  async function readSession(): Promise<Session> {
    return SessionSchema.parse(
      await new RedisService(redis, wideEventService).getJSON<unknown>(
        `session:${sessionID}`,
      ),
    );
  }

  afterEach(async () => {
    await Promise.all(
      registries.map((connectionRegistryService: ConnectionRegistryService) =>
        connectionRegistryService.onModuleDestroy(),
      ),
    );
    registries.length = 0;
  });

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('register', () => {
    it('stores the connection with a lease TTL', async () => {
      const connectionRegistryService: ConnectionRegistryService =
        createRegistry();
      const connection: ConnectionInfo = {
        playerID: hostID,
        sessionID,
        isGuest: true,
      };

      await connectionRegistryService.register({
        socketID: 'socket-1',
        connection,
      });

      expect(await connectionRegistryService.getConnection('socket-1')).toEqual(
        connection,
      );
      expect(await redis.pttl('connection:socket-1')).toBeGreaterThan(0);
      expect(await redis.pttl('connection:socket-1')).toBeLessThanOrEqual(
        timing.leaseMs,
      );
      expect(
        await connectionRegistryService.hasLiveConnection({
          sessionID,
          playerID: hostID,
        }),
      ).toBe(true);
    });
  });

  describe('onModuleInit', () => {
    it('renews the lease of a connected socket beyond its TTL', async () => {
      const connectionRegistryService: ConnectionRegistryService =
        startRegistry();
      await connectionRegistryService.register({
        socketID: 'socket-1',
        connection: { playerID: hostID, sessionID, isGuest: true },
      });

      await delay(timing.leaseMs * 2);

      expect(
        await connectionRegistryService.getConnection('socket-1'),
      ).not.toBeNull();
      expect(
        await connectionRegistryService.hasLiveConnection({
          sessionID,
          playerID: hostID,
        }),
      ).toBe(true);
    });

    it('reports the presence of a crashed instance once its lease expires', async () => {
      const expiredPresences: PlayerPresence[] = [];
      const crashedRegistry: ConnectionRegistryService = createRegistry();
      const survivingRegistry: ConnectionRegistryService = startRegistry();
      survivingRegistry.onPresenceExpired(async (presence: PlayerPresence) => {
        expiredPresences.push(presence);
      });
      await crashedRegistry.register({
        socketID: 'socket-1',
        connection: { playerID: hostID, sessionID, isGuest: true },
      });

      await waitUntil({
        condition: async () => expiredPresences.length > 0,
        deadline: Date.now() + timing.leaseMs * 3,
      });

      expect(expiredPresences).toEqual([{ sessionID, playerID: hostID }]);
      expect(await survivingRegistry.getConnection('socket-1')).toBeNull();
      expect(
        await survivingRegistry.hasLiveConnection({
          sessionID,
          playerID: hostID,
        }),
      ).toBe(false);
    });
  });

  describe('release', () => {
    it('removes the connection and reports the presence after the grace period', async () => {
      const expiredPresences: PlayerPresence[] = [];
      const connectionRegistryService: ConnectionRegistryService =
        startRegistry();
      connectionRegistryService.onPresenceExpired(
        async (presence: PlayerPresence) => {
          expiredPresences.push(presence);
        },
      );
      await connectionRegistryService.register({
        socketID: 'socket-1',
        connection: { playerID: hostID, sessionID, isGuest: true },
      });

      await connectionRegistryService.release('socket-1');
      await delay(timing.disconnectGracePeriodMs / 2);
      const presencesDuringGracePeriod: PlayerPresence[] = [
        ...expiredPresences,
      ];
      await waitUntil({
        condition: async () => expiredPresences.length > 0,
        deadline: Date.now() + timing.disconnectGracePeriodMs * 3,
      });

      expect(presencesDuringGracePeriod).toEqual([]);
      expect(expiredPresences).toEqual([{ sessionID, playerID: hostID }]);
      expect(
        await connectionRegistryService.getConnection('socket-1'),
      ).toBeNull();
    });

    it('ignores a socket that was not registered on this instance', async () => {
      const connectionRegistryService: ConnectionRegistryService =
        createRegistry();

      const connection: ConnectionInfo | null =
        await connectionRegistryService.release('unknown-socket');

      expect(connection).toBeNull();
      expect(await redis.zcard('connection-presence-checks')).toBe(0);
    });
  });

  describe('unregister', () => {
    it('removes a connection registered by another instance', async () => {
      const owningRegistry: ConnectionRegistryService = createRegistry();
      const kickingRegistry: ConnectionRegistryService = createRegistry();
      await owningRegistry.register({
        socketID: 'socket-1',
        connection: { playerID: hostID, sessionID, isGuest: true },
      });

      await kickingRegistry.unregister('socket-1');

      expect(await kickingRegistry.getConnection('socket-1')).toBeNull();
      expect(
        await kickingRegistry.hasLiveConnection({
          sessionID,
          playerID: hostID,
        }),
      ).toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('hands the connections of a stopping instance over to the grace period', async () => {
      const expiredPresences: PlayerPresence[] = [];
      const stoppingRegistry: ConnectionRegistryService = startRegistry();
      const survivingRegistry: ConnectionRegistryService = startRegistry();
      survivingRegistry.onPresenceExpired(async (presence: PlayerPresence) => {
        expiredPresences.push(presence);
      });
      await stoppingRegistry.register({
        socketID: 'socket-1',
        connection: { playerID: hostID, sessionID, isGuest: true },
      });

      await stoppingRegistry.onModuleDestroy();
      await waitUntil({
        condition: async () => expiredPresences.length > 0,
        deadline: Date.now() + timing.disconnectGracePeriodMs * 3,
      });

      expect(await survivingRegistry.getConnection('socket-1')).toBeNull();
      expect(expiredPresences).toEqual([{ sessionID, playerID: hostID }]);
    });
  });

  describe('presence expiry of a session player', () => {
    async function joinHostAndBob({
      sessionService,
    }: {
      sessionService: SessionService;
    }): Promise<JoinedSession> {
      await new RedisService(redis, wideEventService).setJSON(
        `session:${sessionID}`,
        buildSession({ id: sessionID, hostID: '', players: [] }),
      );
      const hostJoin: JoinedSession = await sessionService.join({
        sessionID,
        playerID: hostID,
        user: undefined,
        socketID: 'host-socket',
      });
      await sessionService.join({
        sessionID,
        playerID: bobID,
        user: undefined,
        socketID: 'bob-socket',
      });
      return hostJoin;
    }

    function disconnectAbsentPlayers({
      connectionRegistryService,
      sessionService,
      disconnections,
    }: {
      connectionRegistryService: ConnectionRegistryService;
      sessionService: SessionService;
      disconnections: Session[];
    }): void {
      connectionRegistryService.onPresenceExpired(
        async (presence: PlayerPresence) => {
          const session: Session | null =
            await sessionService.disconnectAbsentPlayer(presence);
          if (session) disconnections.push(session);
        },
      );
    }

    it('keeps the host during the grace period then reassigns it', async () => {
      const disconnections: Session[] = [];
      const connectionRegistryService: ConnectionRegistryService =
        startRegistry();
      const sessionService: SessionService = createSessionService(
        connectionRegistryService,
      );
      disconnectAbsentPlayers({
        connectionRegistryService,
        sessionService,
        disconnections,
      });
      await joinHostAndBob({ sessionService });

      await connectionRegistryService.release('host-socket');
      await delay(timing.disconnectGracePeriodMs / 2);
      const sessionDuringGracePeriod: Session = await readSession();
      await waitUntil({
        condition: async () => disconnections.length > 0,
        deadline: Date.now() + timing.disconnectGracePeriodMs * 3,
      });

      expect(sessionDuringGracePeriod.hostID).toBe(hostID);
      expect(sessionDuringGracePeriod.players[0]).toEqual(
        expect.objectContaining({ username: hostID, connected: true }),
      );
      expect((await readSession()).hostID).toBe(bobID);
      expect((await readSession()).players).toEqual([
        expect.objectContaining({ username: hostID, connected: false }),
        expect.objectContaining({ username: bobID, connected: true }),
      ]);
    });

    it('keeps the host when the player reconnects within the grace period', async () => {
      const disconnections: Session[] = [];
      const connectionRegistryService: ConnectionRegistryService =
        startRegistry();
      const sessionService: SessionService = createSessionService(
        connectionRegistryService,
      );
      disconnectAbsentPlayers({
        connectionRegistryService,
        sessionService,
        disconnections,
      });
      const { reconnectToken }: JoinedSession = await joinHostAndBob({
        sessionService,
      });

      await connectionRegistryService.release('host-socket');
      await sessionService.reconnectPlayer({
        sessionID,
        playerID: hostID,
        reconnectToken,
        user: undefined,
        socketID: 'host-new-socket',
      });
      await delay(timing.disconnectGracePeriodMs * 2);

      expect(disconnections).toEqual([]);
      expect((await readSession()).hostID).toBe(hostID);
      expect((await readSession()).players[0]).toEqual(
        expect.objectContaining({ username: hostID, connected: true }),
      );
    });

    it('keeps the host when its previous socket closes after a reconnection', async () => {
      const disconnections: Session[] = [];
      const connectionRegistryService: ConnectionRegistryService =
        startRegistry();
      const sessionService: SessionService = createSessionService(
        connectionRegistryService,
      );
      disconnectAbsentPlayers({
        connectionRegistryService,
        sessionService,
        disconnections,
      });
      const { reconnectToken }: JoinedSession = await joinHostAndBob({
        sessionService,
      });

      await sessionService.reconnectPlayer({
        sessionID,
        playerID: hostID,
        reconnectToken,
        user: undefined,
        socketID: 'host-new-socket',
      });
      await connectionRegistryService.release('host-socket');
      await delay(timing.disconnectGracePeriodMs * 2);

      expect(disconnections).toEqual([]);
      expect((await readSession()).hostID).toBe(hostID);
    });

    it('reassigns the host of an instance that stopped without closing its sockets', async () => {
      const disconnections: Session[] = [];
      const crashedRegistry: ConnectionRegistryService = createRegistry();
      const survivingRegistry: ConnectionRegistryService = startRegistry();
      const survivingSessionService: SessionService =
        createSessionService(survivingRegistry);
      disconnectAbsentPlayers({
        connectionRegistryService: survivingRegistry,
        sessionService: survivingSessionService,
        disconnections,
      });
      await joinHostAndBob({
        sessionService: createSessionService(crashedRegistry),
      });

      await waitUntil({
        condition: async () => disconnections.length >= 2,
        deadline: Date.now() + timing.leaseMs * 3,
      });

      expect((await readSession()).hostID).toBe('');
      expect((await readSession()).players).toEqual([
        expect.objectContaining({ username: hostID, connected: false }),
        expect.objectContaining({ username: bobID, connected: false }),
      ]);
    });
  });
});
