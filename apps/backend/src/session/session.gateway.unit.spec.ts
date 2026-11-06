import 'reflect-metadata';
import {
  buildSession,
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
    sessionService.leaveGame.mockResolvedValue(session);
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
});
