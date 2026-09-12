import type { z } from 'zod';
import {
  type OnlinePlayer,
  OnlinePlayerSchema,
} from '../schemas/player.schema';

export function buildPlayer(
  username = 'host',
  connected = true,
  overrides: Partial<z.input<typeof OnlinePlayerSchema>> = {},
): OnlinePlayer {
  return OnlinePlayerSchema.parse({
    username,
    isGuest: false,
    connected,
    ...overrides,
  });
}
