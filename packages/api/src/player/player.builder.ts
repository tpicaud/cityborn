import type { z } from 'zod';
import { type OnlinePlayer, OnlinePlayerSchema } from './player.schema';

export function buildPlayer(
  overrides: Partial<z.input<typeof OnlinePlayerSchema>> = {},
): OnlinePlayer {
  return OnlinePlayerSchema.parse({
    username: 'host',
    isGuest: false,
    connected: true,
    ...overrides,
  });
}
