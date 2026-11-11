import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPack,
  type Pack,
  type PackId,
  PackIdSchema,
  type PlayerId,
  PlayerIdSchema,
  UserFacingError,
} from '@cityborn/api';
import {
  enterSession,
  findLaunchedPack,
  launchesGameOnEntry,
} from './useSessionController';

const playerID: PlayerId = PlayerIdSchema.parse('guest');
const packId: PackId = PackIdSchema.parse('pack-nba');

describe('findLaunchedPack', () => {
  it('returns the published pack of the launched pack', () => {
    const packs: Pack[] = [
      buildPack({ id: 'pack-tennis', name: 'Tennis' }),
      buildPack({ id: 'pack-nba', name: 'NBA' }),
    ];

    const launchedPack: Pack = findLaunchedPack({ packs, packId });

    assert.equal(launchedPack.name, 'NBA');
  });

  it('rejects a launched pack missing from the published packs', () => {
    const packs: Pack[] = [buildPack({ id: 'pack-tennis', name: 'Tennis' })];

    assert.throws(
      () => findLaunchedPack({ packs, packId }),
      new UserFacingError('Aucun pack trouvé pour cet identifiant.'),
    );
  });
});

describe('launchesGameOnEntry', () => {
  it('launches the game of a quick play or a launched pack', () => {
    const entries: boolean[] = [
      launchesGameOnEntry({
        session: { quickPlay: true },
        launchedPackId: undefined,
      }),
      launchesGameOnEntry({
        session: { quickPlay: false },
        launchedPackId: packId,
      }),
    ];

    assert.deepEqual(entries, [true, true]);
  });

  it('leaves a classic session in its lobby', () => {
    const launchesGame: boolean = launchesGameOnEntry({
      session: { quickPlay: false },
      launchedPackId: undefined,
    });

    assert.equal(launchesGame, false);
  });
});

describe('enterSession', () => {
  it('starts the game of a quick play once the player has joined', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: true },
      playerID,
      launchedPackId: undefined,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
      playLaunchedPack: async () => {
        actions.push('playLaunchedPack');
      },
    });

    assert.deepEqual(actions, ['join', 'startGame']);
  });

  it('plays the launched pack once the player has joined', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: false },
      playerID,
      launchedPackId: packId,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
      playLaunchedPack: async (launchedPackId: PackId) => {
        actions.push(`playLaunchedPack:${launchedPackId}`);
      },
    });

    assert.deepEqual(actions, ['join', 'playLaunchedPack:pack-nba']);
  });

  it('leaves a classic session in its lobby', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: false },
      playerID,
      launchedPackId: undefined,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
      playLaunchedPack: async () => {
        actions.push('playLaunchedPack');
      },
    });

    assert.deepEqual(actions, ['join']);
  });

  it('does not launch a game the player could not join', async () => {
    const actions: string[] = [];

    await assert.rejects(
      enterSession({
        session: { quickPlay: true },
        playerID,
        launchedPackId: packId,
        join: async () => {
          throw new Error('Solo session already has its player');
        },
        startGame: async () => {
          actions.push('startGame');
        },
        playLaunchedPack: async () => {
          actions.push('playLaunchedPack');
        },
      }),
    );

    assert.deepEqual(actions, []);
  });
});
