import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameRecordSchema, PlayerIdSchema, SessionMode } from '@cityborn/api';
import { createProfileGames } from './profileGame';

test('createProfileGames calcule les scores du profil', () => {
  const localPlayerID = PlayerIdSchema.parse('local-player');
  const otherPlayerID = PlayerIdSchema.parse('other-player');
  const gameRecord = GameRecordSchema.parse({
    id: 'record-1',
    mode: SessionMode.MULTI,
    gameConfig: { categories: [], timer: 25, nbOfObjects: 1 },
    players: [
      { username: localPlayerID, isGuest: false },
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
    createdAt: '2026-09-13T10:00:00.000Z',
  });

  const [profileGame] = createProfileGames([gameRecord], localPlayerID);

  assert.equal(profileGame.localPlayerPoints, 900);
  assert.deepEqual(profileGame.playerScores, [
    { playerID: localPlayerID, points: 900 },
    { playerID: otherPlayerID, points: 700 },
  ]);
});
