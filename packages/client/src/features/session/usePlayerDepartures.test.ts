import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlayer, type PlayerId, PlayerIdSchema } from '@cityborn/api';
import { departedPlayerIDs } from './usePlayerDepartures';

const alice: PlayerId = PlayerIdSchema.parse('alice');

describe('departedPlayerIDs', () => {
  it('lists the players missing from the new players', () => {
    const departures: PlayerId[] = departedPlayerIDs({
      previousPlayers: [
        buildPlayer({ username: 'host' }),
        buildPlayer({ username: 'alice' }),
      ],
      players: [buildPlayer({ username: 'host' })],
    });

    assert.deepEqual(departures, [alice]);
  });

  it('ignores a player who joined or disconnected', () => {
    const departures: PlayerId[] = departedPlayerIDs({
      previousPlayers: [buildPlayer({ username: 'host' })],
      players: [
        buildPlayer({ username: 'host', connected: false }),
        buildPlayer({ username: 'alice' }),
      ],
    });

    assert.deepEqual(departures, []);
  });
});
