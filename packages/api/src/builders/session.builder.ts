import { SessionMode, SessionStatus } from '../schemas/enums';
import type { Session } from '../schemas/session.schema';
import { buildGameConfig } from './game.builder';
import { buildPlayer } from './player.builder';

export function buildSession(overrides: Partial<Session> = {}): Session {
  return structuredClone({
    id: 'session-1',
    hostID: 'host',
    mode: SessionMode.MULTI,
    status: SessionStatus.IN_LOBBY,
    gameConfig: buildGameConfig(),
    players: [buildPlayer('host'), buildPlayer('bob')],
    ...overrides,
  });
}
