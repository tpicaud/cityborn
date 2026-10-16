import type { z } from 'zod';
import { buildGameConfig } from '../game/game.builder';
import { buildPlayer } from '../player/player.builder';
import {
  type Session,
  SessionMode,
  SessionSchema,
  SessionStatus,
} from './session.schema';

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
