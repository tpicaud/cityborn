import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  buildGameConfig,
  buildGameRecord,
  buildPack,
  buildUser,
  type GameRecord,
  type PlayerId,
  PlayerIdSchema,
  SessionMode,
  type User,
} from '@cityborn/api';
import { createProfileGames, type ProfileGame } from './profileGame';

const initialTimeZone: string | undefined = process.env.TZ;

beforeEach(() => {
  process.env.TZ = 'Europe/Paris';
});

afterEach(() => {
  if (initialTimeZone === undefined) {
    delete process.env.TZ;
    return;
  }
  process.env.TZ = initialTimeZone;
});

describe('createProfileGames', () => {
  it('computes the points of a local player found by user id after a rename', () => {
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
      guessObjectsIds: ['object-1', 'object-2'],
      results: {
        [localPlayerID]: {
          results: [
            { guessObjectId: 'object-1', distance: 10, points: 900 },
            { guessObjectId: 'object-2', distance: 30, points: 450 },
          ],
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

    assert.equal(profileGame.points, 1350);
  });

  it('describes a game by its mode, its only pack and its short date', () => {
    const localUser: User = buildUser();
    const gameRecord: GameRecord = buildGameRecord({
      id: 'game-record-7',
      mode: SessionMode.SOLO,
      gameConfig: buildGameConfig({
        packs: [buildPack({ name: 'Roland Garros' })],
      }),
      createdAt: '2026-09-28T10:00:00.000Z',
    });

    const [profileGame]: ProfileGame[] = createProfileGames(
      [gameRecord],
      localUser,
    );

    assert.deepEqual(profileGame, {
      id: 'game-record-7',
      title: 'Solo - Roland Garros',
      playedOn: '28/09/26',
      points: 0,
    });
  });

  it('names a game drawn from several packs a quick play', () => {
    const localUser: User = buildUser();
    const gameRecord: GameRecord = buildGameRecord({
      mode: SessionMode.SOLO,
      gameConfig: buildGameConfig({
        packs: [
          buildPack({ name: 'Monuments' }),
          buildPack({
            id: '00000000-0000-4000-8000-000000000011',
            name: 'Capitales',
          }),
        ],
      }),
    });

    const [profileGame]: ProfileGame[] = createProfileGames(
      [gameRecord],
      localUser,
    );

    assert.equal(profileGame.title, 'Solo - Partie rapide');
  });
});
