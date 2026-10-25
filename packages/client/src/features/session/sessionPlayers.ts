import {
  type PlayerId,
  PlayerIdSchema,
  SessionMode,
  type SessionPlayer,
} from '@cityborn/api';

const soloGuestPlayerID: PlayerId = PlayerIdSchema.parse('guest');

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

export function presetPlayerID({
  mode,
  username,
}: {
  mode: SessionMode | undefined;
  username: PlayerId | undefined;
}): PlayerId | undefined {
  if (username) return username;
  return mode === SessionMode.SOLO ? soloGuestPlayerID : undefined;
}
