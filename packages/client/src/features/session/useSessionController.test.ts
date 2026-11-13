import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type PlayerId, PlayerIdSchema } from '@cityborn/api';
import { enterSession } from './useSessionController';

const playerID: PlayerId = PlayerIdSchema.parse('guest');

describe('enterSession', () => {
  it('starts the game of a quick play once the player has joined', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: true },
      playerID,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
    });

    assert.deepEqual(actions, ['join', 'startGame']);
  });

  it('leaves a classic session in its lobby', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: false },
      playerID,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
    });

    assert.deepEqual(actions, ['join']);
  });

  it('does not start a quick play the player could not join', async () => {
    const actions: string[] = [];

    await assert.rejects(
      enterSession({
        session: { quickPlay: true },
        playerID,
        join: async () => {
          throw new Error('Solo session already has its player');
        },
        startGame: async () => {
          actions.push('startGame');
        },
      }),
    );

    assert.deepEqual(actions, []);
  });
});
