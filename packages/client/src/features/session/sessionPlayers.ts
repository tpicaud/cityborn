import type { SessionPlayer } from '@cityborn/api';

export type PlayerConnectionStatus = 'connected' | 'disconnected' | 'unknown';

export function playerConnectionStatus(
  player: SessionPlayer,
): PlayerConnectionStatus {
  if (player.connected === undefined) return 'unknown';
  return player.connected ? 'connected' : 'disconnected';
}

export function sortPlayersConnectedFirst(
  players: SessionPlayer[],
): SessionPlayer[] {
  return [...players].sort(
    (first, second) =>
      Number(playerConnectionStatus(first) === 'disconnected') -
      Number(playerConnectionStatus(second) === 'disconnected'),
  );
}
