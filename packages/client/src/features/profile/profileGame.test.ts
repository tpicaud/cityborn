import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildGameRecord,
  buildUser,
  type GameRecord,
  type PlayerId,
  PlayerIdSchema,
  SessionMode,
  type User,
} from '@cityborn/api';
import { createProfileGames, type ProfileGame } from './profileGame';

describe('createProfileGames', () => {
  it('computes the scores of a local player found by user id after a rename', () => {
    const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
    const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
    const localUser: User = buildUser({
      id: 'user-1',
      username: 'renamed-player',
    });
    const gameRecord: GameRecord = buildGameRecord({
      mode: SessionMode.MULTI,
      players: [
        { username: localPlayerID, isGuest: false, id: localUser.id },
        { username: otherPlayerID, isGuest: true },
      ],
      guessObjectsIds: ['object-1'],
      results: {
        [localPlayerID]: {
          results: [{ guessObjectId: 'object-1', distance: 10, points: 900 }],
        },
        [otherPlayerID]: {
          results: [{ guessObjectId: 'object-1', distance: 20, points: 700 }],
        },
      },
    });

    const [profileGame]: ProfileGame[] = createProfileGames(
      [gameRecord],
      localUser,
    );

    assert.equal(profileGame.localPlayerPoints, 900);
    assert.deepEqual(profileGame.playerScores, [
      { playerID: 'local-player', points: 900 },
      { playerID: 'other-player', points: 700 },
    ]);
  });
});
