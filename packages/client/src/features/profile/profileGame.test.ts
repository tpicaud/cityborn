import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type GameRecord,
  GameRecordSchema,
  type PlayerId,
  PlayerIdSchema,
  SessionMode,
  type User,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import { createProfileGames, type ProfileGame } from './profileGame';

test('createProfileGames computes the profile scores', () => {
  const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
  const localUser: Pick<User, 'id' | 'username'> = {
    id: UserIdSchema.parse('user-1'),
    username: UsernameSchema.parse('renamed-player'),
  };
  const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
  const gameRecord: GameRecord = GameRecordSchema.parse({
    id: 'record-1',
    mode: SessionMode.MULTI,
    gameConfig: { categories: [], timer: 25, nbOfObjects: 1 },
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
    createdAt: '2026-09-13T10:00:00.000Z',
  });

  const profileGame: ProfileGame | undefined = createProfileGames(
    [gameRecord],
    localUser,
  )[0];
  assert.ok(profileGame);

  assert.equal(profileGame.localPlayerPoints, 900);
  assert.deepEqual(profileGame.playerScores, [
    { playerID: localPlayerID, points: 900 },
    { playerID: otherPlayerID, points: 700 },
  ]);
});
