import { type Session, SessionMode, SessionStatus } from '@cityborn/api';
import { buildGameConfig } from './game';
import { player } from './player';

export function buildSession(overrides: Partial<Session> = {}): Session {
  return structuredClone({
    id: 's1',
    hostID: 'host',
    mode: SessionMode.MULTI,
    status: SessionStatus.IN_LOBBY,
    gameConfig: buildGameConfig(),
    players: [player('host'), player('bob')],
    ...overrides,
  });
}
