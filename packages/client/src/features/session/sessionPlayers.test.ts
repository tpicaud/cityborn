import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlayer, type SessionPlayer } from '@cityborn/api';
import { sortPlayersConnectedFirst } from './sessionPlayers';

describe('sortPlayersConnectedFirst', () => {
  it('lists disconnected players after the other players', () => {
    const players: SessionPlayer[] = [
      buildPlayer('alice', false),
      buildPlayer('bob', true),
      { ...buildPlayer('carol'), connected: undefined },
      buildPlayer('dave', false),
    ];

    const sortedPlayers: SessionPlayer[] = sortPlayersConnectedFirst(players);

    assert.deepEqual(
      sortedPlayers.map(({ username }: SessionPlayer): string => username),
      ['bob', 'carol', 'alice', 'dave'],
    );
  });

  it('leaves the given players untouched', () => {
    const players: SessionPlayer[] = [
      buildPlayer('alice', false),
      buildPlayer('bob', true),
    ];

    sortPlayersConnectedFirst(players);

    assert.deepEqual(
      players.map(({ username }: SessionPlayer): string => username),
      ['alice', 'bob'],
    );
  });
});
