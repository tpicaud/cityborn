import type { OnlinePlayer } from '../schemas/player.schema';

export function buildPlayer(
  username = 'host',
  connected = true,
  overrides: Partial<OnlinePlayer> = {},
): OnlinePlayer {
  return structuredClone({
    username,
    isGuest: false,
    connected,
    ...overrides,
  });
}
