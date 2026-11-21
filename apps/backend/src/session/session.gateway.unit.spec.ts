import 'reflect-metadata';
import {
  buildSession,
  GameIdSchema,
  type Session,
  sessionWsEvent,
  sessionWsServerEvent,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import {
  MESSAGE_MAPPING_METADATA,
  MESSAGE_METADATA,
} from '@nestjs/websockets/constants';
import type { AppServer, AppSocket } from '../common/types/app-socket';
import type { WideEventService } from '../common/wide-event/wide-event.service';
import type { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import { SessionGateway } from './session.gateway';
import type { SessionService } from './session.service';
import { sessionPresenceTiming } from './session-presence-timing';

function subscribedEventNames(gateway: typeof SessionGateway): string[] {
  return Object.getOwnPropertyNames(gateway.prototype).flatMap(
    (property): string[] => {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        gateway.prototype,
        property,
      )?.value;
      if (typeof handler !== 'function') return [];
      if (!Reflect.getMetadata(MESSAGE_MAPPING_METADATA, handler)) return [];

      const eventName: unknown = Reflect.getMetadata(MESSAGE_METADATA, handler);
      return typeof eventName === 'string' ? [eventName] : [];
    },
  );
}

describe('SessionGateway message mapping', () => {
  it('handles exactly the client events declared by the session channel', () => {
    const contractEvents: string[] = Object.values(sessionWsEvent);

    const handledEvents: string[] = subscribedEventNames(SessionGateway);

    expect(handledEvents.sort()).toEqual(contractEvents.sort());
  });
});

type SessionRoom = ReturnType<AppServer['to']>;

describe('SessionGateway.leaveGame', () => {
  it('detaches the socket from the session before broadcasting it to the remaining players', async () => {
    const session: Session = buildSession();
    const sessionService: DeepMocked<SessionService> =
      createMock<SessionService>();
    sessionService.leaveGame.mockResolvedValue({
      session,
      gameId: GameIdSchema.parse('game-1'),
    });
    const gateway: SessionGateway = new SessionGateway(
      sessionService,
      createMock<WideEventService>(),
      createMock<WsWideEventLifecycle>(),
      sessionPresenceTiming,
    );
    const actions: string[] = [];
    const sessionRoom: DeepMocked<SessionRoom> = createMock<SessionRoom>();
    const io: DeepMocked<AppServer> = createMock<AppServer>();
    io.to.mockImplementation(() => {
      actions.push('broadcast');
      return sessionRoom;
    });
    gateway.io = io;
    const socket: DeepMocked<AppSocket> = createMock<AppSocket>({
      data: { player: { sessionID: session.id, playerID: session.hostID } },
    });
    socket.leave.mockImplementation(async () => {
      actions.push('leave');
    });

    await gateway.leaveGame(socket, undefined);

    expect(socket.data.player).toBeNull();
    expect(socket.leave).toHaveBeenCalledWith(session.id);
    expect(sessionRoom.emit).toHaveBeenCalledWith(
      sessionWsServerEvent.update,
      session,
    );
    expect(actions).toEqual(['leave', 'broadcast']);
  });

  it('records the left game in the wide event once the game is dropped', async () => {
    const session: Session = buildSession({ currentGame: undefined });
    const sessionService: DeepMocked<SessionService> =
      createMock<SessionService>();
    sessionService.leaveGame.mockResolvedValue({
      session,
      gameId: GameIdSchema.parse('game-1'),
    });
    const wideEventService: DeepMocked<WideEventService> =
      createMock<WideEventService>();
    const gateway: SessionGateway = new SessionGateway(
      sessionService,
      wideEventService,
      createMock<WsWideEventLifecycle>(),
      sessionPresenceTiming,
    );
    gateway.io = createMock<AppServer>();
    const socket: DeepMocked<AppSocket> = createMock<AppSocket>({
      data: { player: { sessionID: session.id, playerID: session.hostID } },
    });

    await gateway.leaveGame(socket, undefined);

    expect(wideEventService.enrichBusinessContext).toHaveBeenCalledWith({
      gameId: 'game-1',
    });
  });
});

const presenceReconciliationIntervalMs: number =
  sessionPresenceTiming.reconciliationIntervalMs;

function buildPresenceGateway(): {
  gateway: SessionGateway;
  sessionService: DeepMocked<SessionService>;
  io: DeepMocked<AppServer>;
} {
  const sessionService: DeepMocked<SessionService> =
    createMock<SessionService>();
  sessionService.pruneExpiredSessionsAndListIDs.mockResolvedValue([]);
  sessionService.hasPlayerAbsence.mockReturnValue(false);
  const gateway: SessionGateway = new SessionGateway(
    sessionService,
    createMock<WideEventService>(),
    createMock<WsWideEventLifecycle>({
      runDisconnection: async (_socket, _eventName, handler) => handler(),
    }),
    sessionPresenceTiming,
  );
  const io: DeepMocked<AppServer> = createMock<AppServer>();
  io.fetchSockets.mockResolvedValue([]);
  gateway.io = io;
  return { gateway, sessionService, io };
}

function buildPlayerSocket(): DeepMocked<AppSocket> {
  const session: Session = buildSession();
  return createMock<AppSocket>({
    data: { player: { sessionID: session.id, playerID: session.hostID } },
  });
}

describe('SessionGateway.afterInit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stops after the startup pass when no absence is in progress', async () => {
    const {
      gateway,
      sessionService,
      io,
    }: ReturnType<typeof buildPresenceGateway> = buildPresenceGateway();

    gateway.afterInit();
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 3);

    expect(jest.getTimerCount()).toBe(0);
    expect(sessionService.pruneExpiredSessionsAndListIDs).toHaveBeenCalledTimes(
      1,
    );
    expect(io.fetchSockets).toHaveBeenCalledTimes(1);
  });

  it('runs another pass when a player disconnects during a pass', async () => {
    const {
      gateway,
      sessionService,
      io,
    }: ReturnType<typeof buildPresenceGateway> = buildPresenceGateway();
    io.fetchSockets.mockImplementationOnce(async () => {
      await gateway.handleDisconnect(buildPlayerSocket());
      return [];
    });

    gateway.afterInit();
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 3);

    expect(sessionService.pruneExpiredSessionsAndListIDs).toHaveBeenCalledTimes(
      2,
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('retries a pass that failed', async () => {
    const {
      gateway,
      sessionService,
      io,
    }: ReturnType<typeof buildPresenceGateway> = buildPresenceGateway();
    io.fetchSockets.mockRejectedValueOnce(new Error('redis unavailable'));

    gateway.afterInit();
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 3);

    expect(io.fetchSockets).toHaveBeenCalledTimes(2);
    expect(sessionService.pruneExpiredSessionsAndListIDs).toHaveBeenCalledTimes(
      1,
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('retries a pass in which the reconciliation of a session failed', async () => {
    const { gateway, sessionService }: ReturnType<typeof buildPresenceGateway> =
      buildPresenceGateway();
    const session: Session = buildSession();
    sessionService.pruneExpiredSessionsAndListIDs.mockResolvedValue([
      session.id,
    ]);
    sessionService.reconcilePlayerPresence
      .mockRejectedValueOnce(new Error('session lock unavailable'))
      .mockResolvedValue(null);

    gateway.afterInit();
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 3);

    expect(sessionService.reconcilePlayerPresence).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('SessionGateway.handleDisconnect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the reconciliation until the absence is resolved', async () => {
    const { gateway, sessionService }: ReturnType<typeof buildPresenceGateway> =
      buildPresenceGateway();
    sessionService.hasPlayerAbsence
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);

    await gateway.handleDisconnect(buildPlayerSocket());
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 5);

    expect(jest.getTimerCount()).toBe(0);
    expect(sessionService.pruneExpiredSessionsAndListIDs).toHaveBeenCalledTimes(
      3,
    );
  });

  it('ignores the disconnection of a socket without player', async () => {
    const { gateway }: ReturnType<typeof buildPresenceGateway> =
      buildPresenceGateway();

    await gateway.handleDisconnect(createMock<AppSocket>({ data: {} }));

    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start a second loop when a player disconnects while it runs', async () => {
    const { gateway, sessionService }: ReturnType<typeof buildPresenceGateway> =
      buildPresenceGateway();

    gateway.afterInit();
    await gateway.handleDisconnect(buildPlayerSocket());
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs);

    expect(sessionService.pruneExpiredSessionsAndListIDs).toHaveBeenCalledTimes(
      1,
    );
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('SessionGateway.onModuleDestroy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not restart once the module is destroyed', async () => {
    const {
      gateway,
      sessionService,
      io,
    }: ReturnType<typeof buildPresenceGateway> = buildPresenceGateway();
    gateway.afterInit();

    gateway.onModuleDestroy();
    await gateway.handleDisconnect(buildPlayerSocket());
    await jest.advanceTimersByTimeAsync(presenceReconciliationIntervalMs * 3);

    expect(jest.getTimerCount()).toBe(0);
    expect(io.fetchSockets).not.toHaveBeenCalled();
    expect(
      sessionService.pruneExpiredSessionsAndListIDs,
    ).not.toHaveBeenCalled();
  });
});
