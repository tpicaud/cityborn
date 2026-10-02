import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayerIdSchema, type SessionPlayer } from '@cityborn/api';
import { sortPlayersConnectedFirst } from './sessionPlayers';

function buildPlayer(username: string, connected?: boolean): SessionPlayer {
  return { username: PlayerIdSchema.parse(username), isGuest: true, connected };
}

test('disconnected players are listed after the other players', () => {
  const players: SessionPlayer[] = [
    buildPlayer('alice', false),
    buildPlayer('bob', true),
    buildPlayer('carol'),
    buildPlayer('dave', false),
  ];

  const sortedUsernames: string[] = sortPlayersConnectedFirst(players).map(
    ({ username }) => username,
  );

  assert.deepEqual(sortedUsernames, ['bob', 'carol', 'alice', 'dave']);
});

test('sorting players leaves the session players untouched', () => {
  const players: SessionPlayer[] = [
    buildPlayer('alice', false),
    buildPlayer('bob', true),
  ];

  sortPlayersConnectedFirst(players);

  assert.deepEqual(
    players.map(({ username }) => username),
    ['alice', 'bob'],
  );
});
