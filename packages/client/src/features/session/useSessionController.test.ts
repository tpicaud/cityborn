import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type PackId,
  PackIdSchema,
  type PlayerId,
  PlayerIdSchema,
} from '@cityborn/api';
import { enterSession } from './useSessionController';

const playerID: PlayerId = PlayerIdSchema.parse('guest');
const packId: PackId = PackIdSchema.parse('pack-nba');

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
