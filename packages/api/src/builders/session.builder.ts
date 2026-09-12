import type { z } from 'zod';
import { SessionMode, SessionStatus } from '../schemas/enums';
import { type Session, SessionSchema } from '../schemas/session.schema';
import { buildGameConfig } from './game.builder';
import { buildPlayer } from './player.builder';

export function buildSession(
  overrides: Partial<z.input<typeof SessionSchema>> = {},
): Session {
  return SessionSchema.parse({
    id: 'session-1',
    hostID: 'host',
    mode: SessionMode.MULTI,
    status: SessionStatus.IN_LOBBY,
    gameConfig: buildGameConfig(),
    players: [buildPlayer('host'), buildPlayer('bob')],
    ...overrides,
  });
}
