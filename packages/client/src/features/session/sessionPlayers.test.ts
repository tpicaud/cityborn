import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPlayer,
  type PlayerId,
  PlayerIdSchema,
  SessionMode,
  type SessionPlayer,
} from '@cityborn/api';
import { presetPlayerID, sortPlayersConnectedFirst } from './sessionPlayers';

describe('sortPlayersConnectedFirst', () => {
  it('lists disconnected players after the other players', () => {
    const players: SessionPlayer[] = [
      buildPlayer({ username: 'alice', connected: false }),
      buildPlayer({ username: 'bob', connected: true }),
      { ...buildPlayer({ username: 'carol' }), connected: undefined },
      buildPlayer({ username: 'dave', connected: false }),
    ];

    const sortedPlayers: SessionPlayer[] = sortPlayersConnectedFirst(players);

    assert.deepEqual(
      sortedPlayers.map(({ username }: SessionPlayer): string => username),
      ['bob', 'carol', 'alice', 'dave'],
    );
  });

  it('leaves the given players untouched', () => {
    const players: SessionPlayer[] = [
      buildPlayer({ username: 'alice', connected: false }),
      buildPlayer({ username: 'bob', connected: true }),
    ];

    sortPlayersConnectedFirst(players);

    assert.deepEqual(
      players.map(({ username }: SessionPlayer): string => username),
      ['alice', 'bob'],
    );
  });
});

describe('presetPlayerID', () => {
  it('presets the username of a signed-in player', () => {
    const username: PlayerId = PlayerIdSchema.parse('alice');

    const playerIDs: (PlayerId | undefined)[] = [
      SessionMode.SOLO,
      SessionMode.MULTI,
    ].map((mode: SessionMode) => presetPlayerID({ mode, username }));

    assert.deepEqual(playerIDs, ['alice', 'alice']);
  });

  it('presets the guest player of a solo session only', () => {
    const playerIDs: (PlayerId | undefined)[] = [
      SessionMode.SOLO,
      SessionMode.MULTI,
      undefined,
    ].map((mode: SessionMode | undefined) =>
      presetPlayerID({ mode, username: undefined }),
    );

    assert.deepEqual(playerIDs, ['guest', undefined, undefined]);
  });
});
