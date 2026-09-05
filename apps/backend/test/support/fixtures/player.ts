import type { OnlinePlayer } from '@cityborn/api';

export function player(
  username = 'host',
  connected = true,
  overrides: Partial<OnlinePlayer> = {},
): OnlinePlayer {
  return { username, isGuest: false, connected, ...overrides };
}
