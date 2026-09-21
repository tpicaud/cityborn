import type { PlayerId, Session } from '@cityborn/api';
import {
  buildSession,
  ErrorCode,
  PlayerIdSchema,
  SessionSchema,
  sessionWsEvent,
  sessionWsServerEvent,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import { RedisService } from '../../src/redis/redis.service';
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
  let client: Socket;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    client = io(await app.getUrl(), { transports: ['websocket'] });
    await new Promise<void>((resolve) =>
      client.once('connect', () => resolve()),
    );
  });

  afterAll(async () => {
    client?.disconnect();
    await app?.close();
  });

  it('acknowledges a contract violation with a bad request error', async () => {
    const ack = await emitWithAck(client, sessionWsEvent.join, {
      sessionID: 'session-1',
    });

    expect(ack).toMatchObject({
      success: false,
      error: { statusCode: 400, code: ErrorCode.BAD_REQUEST },
    });
  });

  it('acknowledges a join and broadcasts the updated session', async () => {
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

    expect(ack).toEqual({ success: true });
    expect(SessionSchema.parse(await broadcast).players).toEqual([
      ...session.players,
      { username: playerID, isGuest: true, connected: true },
    ]);
  });
});
